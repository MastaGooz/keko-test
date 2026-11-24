/**
 * LE VAISSEAU — `?vaisseau`, un side project (Keko, 08/11 : « un nouveau proto
 * où on conduit un petit vaisseau dans l'espace, le déplacement qu'on avait
 * utilisé pour le vampire survivor : juste le vaisseau et un fond type espace
 * avec quelques astéroïdes »).
 *
 * Le contrôle est le MANCHE FLOTTANT du survivor (`directionDuManche`,
 * `centreQuiSuit`, repris tels quels) ; mais un vaisseau n'est pas un héros
 * qui marche : **le manche POUSSE** (une accélération vers la direction
 * voulue), le vide freine à peine, la vitesse est plafonnée, et le nez se
 * tourne vers là où l'on va. Le CHAMP D'ASTÉROÏDES est infini et seedé : chaque
 * case du monde tire son astéroïde de ses coordonnées, le même à chaque
 * visite, sans rien stocker. Un astéroïde touché repousse le vaisseau et le
 * fait rebondir.
 *
 * LE FORAGE (Keko : « un dispositif de forage laser sur le toit ») : le laser
 * vise seul ce qui est le plus proche à portée, roche ou ennemi, et le creuse ;
 * une roche éclatée laisse des pépites aimantées. L'ENNEMI (Keko : « un ennemi
 * qui mine et qui tire ») : un rival qui apparaît au loin, mine la roche la
 * plus proche de lui (les deux creusent les mêmes roches), ramasse ses propres
 * pépites, et dès qu'il a le joueur à portée, le garde à distance et lui tire
 * dessus ; abattu, il rend son butin.
 *
 * Pur : le temps est injecté (en secondes), le monde modifié en place. Les
 * unités sont celles de la scène en pixels (le vaisseau fait 4 unités de rayon).
 */
import { centreQuiSuit, directionDuManche, type ConfigSurvivor, type Vecteur } from '../survivor/jeu.ts'

export { centreQuiSuit, directionDuManche }
export type { Vecteur }

export const VAISSEAU = {
  /** La poussée du manche à fond, en unités par seconde carrée. */
  poussee: 150,
  /**
   * LA PART DE LA POUSSÉE QUAND ON POUSSE À L'OPPOSÉ DU NEZ (Keko, 13/11) — d'abord la marche arrière du pilotage à
   * deux manches (70 %), puis ÉTENDUE AU MANCHE SEUL ET CREUSÉE À 50 % : « c'est dommage que la maniabilité ne se
   * sente pas quand on utilise un seul stick ». Le propulseur pousse dans l'axe du nez : tant que le nez n'a pas
   * tourné vers la direction demandée, la poussée est réduite — la moitié droit derrière lui, tout de côté et devant,
   * au prorata entre les deux. UN PROPULSEUR MANIABLE aligne son nez vite et retrouve vite sa pleine poussée : la
   * maniabilité se sent à chaque demi-tour.
   */
  marcheArriere: 0.5,
  /**
   * LE PILOTAGE À TOURELLES (Keko, 13/11 — le cuirassé : « ses armes sont des armes embarquées, il peut tirer dans
   * toutes les directions en continuant d'avancer ; le deuxième stick ne devrait pas le faire tourner sur lui-même ») :
   * DEUX SYSTÈMES. Faux — LE CHASSEUR : le regard (le second manche, la souris) tourne le nez, les armes tirent où il
   * pointe. Vrai — LE VAISSEAU À TOURELLES : le regard ne tourne PAS la coque, il ne dirige que le tir des armes (et
   * la caméra) ; seul le manche du vol la fait virer, à la vitesse de sa maniabilité.
   */
  tourelles: false as boolean,
  /**
   * OMNIDIRECTIONNEL (la Sentinelle, Keko, 15/11 : « une soucoupe sans devant ni derrière, des propulseurs tout autour,
   * qui se déplace sans changer d'orientation ») : la coque NE TOURNE JAMAIS ; la poussée suit le manche, comme toujours.
   */
  omni: false as boolean,
  /** La vitesse de pointe. */
  vitesseMax: 110,
  /** Le frein du vide, par seconde : `v *= exp(−frein·dt)`. Faible : on glisse. */
  frein: 0.55,
  /** La vitesse à laquelle le nez se tourne vers le cap voulu, en radians par seconde. */
  rotation: 7,
  /** Le rayon du vaisseau. */
  rayon: 4,
  /** LA MASSE du vaisseau, en tonnes : le poids total de ses pièces (le hangar la pose ; 30 de série). Elle se mesure à celle des roches, dans un choc. */
  masse: 30,
  /**
   * LE VIRAGE, l'agilité en déplacement (Keko, 18/11, pour le vortex : la maniabilité ne réglait plus que le nez, qui se
   * tourne seul — « un vaisseau lourd sera peu maniable, un vaisseau léger tournera sec ») : quand on pousse, la vitesse
   * PLIE vers le manche à `virage` radians par seconde, sans rien perdre de son élan — un vaisseau agile vire sec, un
   * lourd glisse et dérive avant de répondre. 0 : rien ne plie (`?vaisseau`, les insectes) ; le vortex le calcule
   * (`configDuVol`).
   */
  virage: 0,
  /** La part de vitesse rendue par un rebond sur un astéroïde. */
  rebond: 0.45,
  /** En dessous de cette vitesse normale, toucher une roche n'est pas un choc (on s'y appuie, on glisse le long). */
  seuilChoc: 12,
  /** La coque du joueur : tant de points avant d'être percée (un trait en enlève un, un choc en enlève selon sa vitesse). */
  coque: 5,
  /**
   * LE BOUCLIER du joueur (la coque à bouclier du hangar) : tant de points qui prennent les coups avant la coque, et se
   * rechargent de `regain` point par seconde passé `delai` secondes sans coup. Zéro point : pas de bouclier.
   */
  // (`plein` : en tant de secondes le bouclier se remplit tout entier — sa recharge EN PART de lui-même, Keko, 21/11 : « le
  // bouclier se régénère après 5 secondes sans subir de dégâts, et met 10 secondes à se régénérer totalement » ; une carte
  // qui le grandit grandit ce qu'il regagne ; 0 : `regain` points par seconde, comme avant)
  bouclier: { points: 0, delai: 4, regain: 0.5 } as { points: number; delai: number; regain: number; plein?: number },
  /**
   * LA COQUE SE RÉGÉNÈRE (l'Essaim, Keko, 17/11 : « une barre de vie qui se régénère lentement sur la durée, beaucoup
   * plus lentement que le bouclier, mais en permanence ») : TANT DE LA COQUE PLEINE PAR SECONDE, coup reçu ou non — une
   * part, pas des points (Keko, 17/11 : « on régénère les PV en % » : elle suit la coque qui grandit). Zéro : jamais.
   */
  regeneration: 0,
  /**
   * LA RÉPARATION DES PLAQUES (l'Empire, Keko, 21/11 — « réparation en % », choisi parmi trois) : une plaque cassée
   * revient au bout de `reparation` secondes sans qu'une autre casse — une à la fois. Zéro : elles ne se réparent pas.
   */
  reparation: 0,
  /**
   * LES PLAQUES DE BLINDAGE (les humains, Keko, 17/11 — d'abord une plaque par portion de la barre ; puis « tout
   * simplement : tu as 3 plaques, tu peux subir 3 coups avant que ta vraie barre de vie soit entamée ; l'histoire de
   * correspondre à des portions de vie va rendre les joueurs confus ») : tant qu'il reste une plaque, LE COUP EST PRIS
   * TOUT ENTIER par la première encore debout (que ce soit 1 ou 4 points), et elle casse ; ensuite seulement la coque est
   * touchée. Elles ne se réparent pas (elles reviennent pleines quand le vaisseau revient au portail). Zéro : aucune.
   */
  plaques: 0,
  /**
   * LA RÉCUPÉRATION DES PLAQUES (l'Empire, Keko, 22/11 : « les plaques ne vont pas se régénérer avec le temps ; en
   * détruisant des astéroïdes, on a une chance de faire tomber un petit objet en forme de bouclier gris, brillant, qui
   * restaure une plaque ; plus l'astéroïde est gros, plus la chance est importante ; ainsi, pour réparer ces plaques, ils
   * devront miner des astéroïdes ») : ce qui multiplie la chance d'une roche (`derive.plaque`) — les cartes
   * « Récupération » la grandissent. Seul un vaisseau à plaques en fait tomber.
   * (… PUIS DES INSECTES, PLUS DES ROCHES — Keko, 23/11 : « on va faire dropper les plaques par les ennemis au lieu des
   * astéroïdes » : la chance est celle d'un insecte, `invasion.plaque` — voir `chanceDePlaque`.)
   */
  recuperation: 1,
  /**
   * LA CORRUPTION (les Innommés, Keko, 17/11 : les blessures différées, « quelque chose qui se voit sur la barre de vie
   * pour comprendre rapidement son fonctionnement ») : un coup ne vide pas la coque — LA PART TOUCHÉE DEVIENT CORROMPUE (la
   * vie en sursis), puis LA CORRUPTION RONGE la coque de `ronge` points par seconde ; chaque insecte abattu en PURGE `purge`
   * points (ils reviennent sains). La coque toute corrompue, le coup suivant passe tout droit. `ronge` à zéro : aucune.
   */
  corruption: { ronge: 0, purge: 0 },
  /**
   * LE DÉPHASAGE (les Yhg'tharr, Keko, 20/11 — à la place de la corruption, « pas hyper facile à comprendre » : « chaque
   * vaisseau obtient une chance de déphasage, entre 5 et 15 % ; à chaque fois que le vaisseau est touché, il joue cette
   * chance, et s'il réussit, à la place de subir les dégâts, il entre en déphasage ; il devient invincible et traverse tous
   * les obstacles, pendant un court instant ») : un coup qui atteint le blindage (le bouclier, s'il y en a un, le prend
   * d'abord) est esquivé avec la chance `chance` — un tirage seedé —, et pendant `duree` secondes le vaisseau ne prend
   * plus aucun coup et ne heurte plus rien, ni roche ni insecte. `chance` à zéro : jamais. (La durée est de moi.)
   * PLUS D'INVINCIBILITÉ (Keko, 24/11 : « on lui enlève son effet d'invincibilité ; juste une chance d'annuler complètement
   * les dégâts subis ; si on monte trop haut la chance, il se déclenche régulièrement — sans l'invincibilité, on évite un
   * coup, et l'instant d'après on peut en prendre un deuxième ; avec, on enchaîne l'invincibilité presque à l'infini ») :
   * le coup esquivé est annulé, c'est tout — ni intouchable, ni traversée ; `duree` n'est plus que celle de son dessin.
   */
  dephasage: { chance: 0, duree: 0.3 },
  /**
   * L'INVULNÉRABILITÉ APRÈS UN COUP (Keko, 17/11 : « quand le vaisseau touche un ennemi, il devrait subir des dégâts,
   * clignoter une petite seconde, et pendant cet intervalle ne pas pouvoir prendre d'autres dégâts ; sinon on peut se
   * faire éclater en un rien de temps avec de multiples touches très rapides ») : tant de secondes, après un coup reçu —
   * dans le bouclier, une plaque ou la coque —, pendant lesquelles les autres ne comptent pas. Un insecte qui touche
   * donnait DEUX coups dans la même image, sa morsure et le choc : la plaque prenait le premier, la barre le second.
   */
  invulnerabilite: 1,
  /**
   * L'UNITÉ DE VIE : ce que vaut « un point » de blindage ou de bouclier (1 ; au vortex, `vieMultipliee` la pose — Keko,
   * 20/11 : « 9 points de vie, c'est beaucoup trop faible, ça laisse trop peu de marge pour les échelles de dégâts ») :
   * ce qu'ajoute un talent « un point de plus », ce qu'il faut de bouclier pour qu'il soit levé.
   */
  uniteDeVie: 1,
  /** LE FOREUR DU JOUEUR d'après la foreuse montée au hangar (`hangar.ts`) : des facteurs sur le débit et la portée de `forage`, et sur la portée de son aimant (1 = de série). Le rival creuse avec `forage` tel quel. IL NE SERT QU'AUX ROCHES (Keko, 09/11 : « rendre la foreuse exclusive aux astéroïdes, plus une arme »). */
  foreuse: { debit: 1, portee: 1, aimant: 1 },
  /**
   * LES ARMES TIRENT À TOUR DE RÔLE (le jeu du vortex — Keko, 14/11 : « je voudrais vraiment que les deux tirent un par
   * un, pas en même temps : d'abord gauche, puis droite, dans un rythme équilibré ») : quand une arme tire, les autres
   * attendent au moins sa cadence divisée par le nombre d'armes. Sans cela, des armes rechargées en même temps — tout
   * le temps passé sans cible — partaient ensemble à la première cible, et restaient ensemble.
   */
  alternance: false as boolean,
  /**
   * LA DURÉE DES ÉTATS — le gel, le feu, la corrosion —, QUELLE QUE SOIT LEUR SOURCE (le vortex — Keko, 23/11 : « on met la
   * durée de tous les effets à 6 s quel que soit leur source ») : 0, chaque source garde la sienne (le Nova Drifter, dont
   * les fiches la disent) ; le vortex pose 6.
   */
  dureeDesEtats: 0 as number,
  /**
   * LA BRÛLURE ET L'ARC D'ÉLECTROCUTION, LES MÊMES QUELLE QUE SOIT LEUR SOURCE (le vortex — Keko, 24/11 : « je veux que les
   * dégâts de brûlure soient toujours les mêmes quelle que soit la source ; pareil pour électrocution ») : ce qu'un insecte
   * brûlé perd par seconde, ce qu'un arc fait ; 0, ceux de la source (le Nova Drifter). Le vortex pose 20 et 60 ; la carte
   * « Brûlure » grandit la brûlure (voir `avecLesBonus`), les cartes « Dégâts » d'une arme ne touchent ni l'une ni l'autre.
   */
  brulureDesEtats: 0 as number,
  arcDElectrocution: 0 as number,
  /**
   * CE QUE LES CARTES D'ÉTAT AJOUTENT À TOUS LES EFFETS DE LEUR ÉLÉMENT (Keko, 24/11 : « je valide le fait que les cartes
   * augmentent tous les effets d'un élément » — contre les dégâts fixes des cartes spéciales, qui seraient devenus obsolètes
   * en fin de partie ; « juste la solution des cartes suffit », pas d'indexation au niveau) : la somme de leurs bonus, en part
   * (0,25 = +25 %). Brûlure : la combustion ; corrosion : la flaque, le point faible ; électrocution : l'arc, la foudre ;
   * givre : le gel profond. Ce que ces cartes grandissaient déjà — la brûlure (`brulureDesEtats`), la vulnérabilité, la
   * chance d'arc, le ralenti — reste aux armes (voir `avecLesBonus`).
   */
  renforts: { feu: 0, corrosion: 0, givre: 0, electrocution: 0 } as { feu: number; corrosion: number; givre: number; electrocution: number },
  /** LES CARTES SPÉCIALES D'ÉLÉMENT PRISES (Keko, 24/11 — voir `ELEMENTAIRES`). */
  elementaires: { gelure: false, incendie: false, vulnerabilite: false, foudre: false, dissolution: false, combustion: false, surtension: false, auraGlaciale: false } as { gelure: boolean; incendie: boolean; vulnerabilite: boolean; foudre: boolean; dissolution: boolean; combustion: boolean; surtension: boolean; auraGlaciale: boolean },
  /**
   * L'ARC DE TIR (le jeu du vortex — Keko, 15/11 : « limiter les tirs du canon à un angle qui va devant le vaisseau ;
   * pas forcément tout droit, mais les empêcher de tirer en angle droit sur les côtés et en arrière, pour forcer le
   * joueur à se positionner face aux ennemis ») : le demi-angle, en radians, de part et d'autre du nez ; une arme ne
   * prend pour cible qu'un ennemi dans cet arc, et son tir n'en sort pas. Zéro : aucune limite (le Nova Drifter).
   */
  arcDeTir: 0,
  /**
   * CHAQUE FOREUSE MONTÉE CREUSE (Keko, 13/11 — le cuirassé en porte deux, une seule travaillait : « chaque foreuse
   * attaque la roche la plus près de sa propre position, et à portée ») : la liste des foreuses du vaisseau — leurs
   * facteurs de débit et de portée, la place d'outil où chacune est montée, son cran, et OÙ ELLE EST sur le vaisseau
   * (en unités, depuis son centre : c'est le rendu qui le sait, la page le pose au décollage). Vide : le foreur
   * unique de `foreuse`, comme avant (la configuration nue, le rival).
   */
  foreuses: [] as { debit: number; portee: number; outil: number; cran: number; place?: Vecteur }[],
  /** LES ARMES du joueur, montées au hangar (deux au plus) : chacune tire seule sur le rival le plus proche à sa portée. Aucune de série. */
  armes: [] as Arme[],
  /** LE RADAR du joueur (un outil du hangar) : à tant d'unités, le rival est désigné au bord de l'écran ; zéro, pas de radar. La page le lit, la règle n'en fait rien. */
  radar: { portee: 0 },
  /**
   * LES PASSIFS DU LABO qui ne sont pas des facteurs sur le reste (`labo.ts`) : la chance qu'une pépite d'une roche
   * creusée PAR LE JOUEUR naisse double ; la chance qu'un obus soit CRITIQUE, et ce qu'il fait alors. Zéro de série.
   */
  passifs: { pepiteDouble: 0, critique: 0, critiqueFacteur: 2 },
  /**
   * LA POSTCOMBUSTION, une mécanique du labo (`postcombustion`) : pendant `duree` secondes la poussée et la pointe sont
   * multipliées, puis la pointe retombe en `retombee` secondes (coupée net, la vitesse butait d'un coup) ; elle se
   * recharge en `recharge` secondes depuis son départ. Sans manche, elle pousse droit devant. Éteinte de série.
   */
  postcombustion: { active: false as boolean, duree: 1.1, retombee: 0.6, recharge: 6, poussee: 2.6, vitesse: 1.8 },
  /** LA CAPACITÉ de la soute (une caractéristique de la coque — Keko) : tant de pépites à bord au plus ; pleine, les pépites restent là où elles sont. */
  capacite: 20,
  /**
   * LES CHOCS FONT MAL AUX DEUX (Keko : « des dégâts proportionnels à la vitesse de la collision, aux deux parties ») :
   * au-delà du seuil de choc, chaque unité de vitesse normale coûte tant de points de coque au vaisseau (le joueur ou
   * l'ennemi) et creuse la roche de tant de points. À pleine vitesse (110), le joueur perd 2 points et la roche en
   * prend 29 : une roche de 6 de rayon éclate d'un coup, une de 14 (118 points) en demande quatre. Le rival ÉVITE les
   * roches à moins de `evite` unités (il est poussé à l'écart) : sondé, une seule collision lui coûtait 72 % de sa vie.
   */
  /**
   * … ET LE POIDS COMPTE (Keko, 12/11 : « qu'un gros vaisseau n'ait pas l'air de se faire arrêter net par un petit
   * astéroïde ») : une roche pèse `masseRoche` tonnes par unité de rayon au carré (25 t à 5 de rayon, 196 à 14). Quand
   * elle pèse moins de `perce` fois le vaisseau, un choc franc LA BRISE au lieu de le faire rebondir : il la traverse en
   * ne perdant que la part de sa vitesse que pèse la roche (roche ÷ vaisseau), et sa coque ne prend que cette part du
   * coup. De série (30 t) rien n'est assez léger ; il faut plus de 50 t pour traverser les plus petites.
   */
  collision: { degatsCoque: 0.02, degatsEnnemi: 0.12, degatsRoche: 0.3, evite: 24, masseRoche: 1, perce: 0.5 },
  /**
   * LES STATIONS D'EXTRACTION (Keko : « un point d'extraction où déposer les ressources qu'on porte » ; puis « on
   * devrait mettre des extracteurs régulièrement, si le joueur se balade pendant vingt minutes ça va être compliqué ») :
   * UNE PAR CASE de tant d'unités (900 d'abord, puis 2 000 : « trop fréquent, on veut qu'il y ait quand même une prise de
   * risque à s'éloigner » ; « encore trop fréquent »), posée dans sa case d'après ses coordonnées hachées (celle de la case (0, 0) est au
   * point de départ), le vide du champ autour de chacune en parvis. RIEN NE S'Y DÉPOSE AU PASSAGE (Keko : « on peut
   * extraire les ressources sans mettre fin à la partie, donc à quoi sert le timer ? il faudrait que ce soit le seul
   * moyen de sécuriser les ressources ») : le minerai reste à bord jusqu'à l'EXTRACTION, et se perd avec la coque.
   * (`cadence` reste pour la cadence d'un éventuel retour du dépôt ; plus rien ne la lit.)
   */
  /**
   * LES FILONS (Keko : « récolter différentes ressources, des tiers de ressources ») : trois minerais, le FER (commun),
   * l'OR (peu commun), le CRISTAL (rare). Chaque roche en porte un, tiré de sa case, et une RICHESSE (0,25 à 1, biaisée
   * vers les pauvres) qui dit combien de pépites elle rend. L'or et le cristal sont plus fréquents LOIN du départ (la
   * part monte de `…Pres` à `…Loin` sur `horizon` unités) : s'éloigner des stations paie, et c'est là qu'est le risque.
   */
  filons: { horizon: 3000, orPres: 0.16, orLoin: 0.38, cristalPres: 0.03, cristalLoin: 0.16 },
  /**
   * UNE SEULE STATION POUR L'INSTANT (Keko, 11/11 : « supprimer les petits extracteurs du jeu pour l'instant, je préfère
   * un seul point d'entrée et de sortie ») : `seule` ne garde que la base, au point de départ — `stationLaPlusProche`
   * la rend toujours. Les extracteurs par case restent écrits (`stationDeLaCase`), éteints.
   */
  station: { case: 4500, rayon: 11, portee: 36, cadence: 0.12, seule: true as boolean },
  /**
   * LA BASE (Keko, 11/11 : « modifier le premier extracteur, celui du spawn, pour qu'il n'y ait pas d'ennemi à proximité
   * au début, et surtout l'agrandir pour qu'il ressemble à une station spatiale ») : la station du point de départ est
   * une vraie station — le champ est vide jusqu'à `rayon` d'elle (son envergure), et C'EST UNE ZONE CALME : aucun rival
   * ne NAÎT tant que le joueur est à moins de `calme` d'elle, et il naît du côté opposé à elle. (Un rival déjà né peut
   * y suivre le joueur : l'extraction reste une menace au retour.)
   */
  base: { rayon: 100, calme: 380 },
  /**
   * L'EXTRACTION (Keko : « un timer quand le joueur est dans la zone de l'extracteur ; s'il reste jusqu'au bout, la
   * partie prend fin ») : à quai, un compte monte pendant tant de secondes ; on en sort, il REDESCEND à la même
   * vitesse (il retombait à zéro : un frôlement du bord punissait tout) ; au bout, la partie est EXTRAITE (finie,
   * gagnée) et TOUT LE MINERAI PORTÉ PASSE EN BANQUE — le seul moyen de le mettre à l'abri. Il ne court qu'après être
   * sorti une fois du parvis : on naît à quai.
   */
  extraction: { duree: 10 },
  /**
   * L'INVASION (le jeu du vortex — Keko, 14/11 : « des ennemis, forme insectoïde, qui se rendent au portail pour le
   * traverser ; arrivés dans la zone du portail, ils y disparaissent. Si le joueur est dans la zone de l'unité, elle
   * l'aggro et le suit ; elle arrête de le suivre s'il l'éloigne trop de sa zone ou du portail. Idée : on défend le
   * portail des vagues d'ennemis »). Éteinte dans le Nova Drifter. Le portail est au centre du monde ; les insectes
   * naissent sur un cercle autour (`naissance`), PAR VAGUES (`vague` insectes, `renfort` de plus à chaque vague, un
   * toutes les `cadence` secondes ; `repos` entre deux vagues, une fois la précédente finie), et MARCHENT vers lui ; à
   * `portail` de son centre — LE CONTOUR DU PORTAIL —, ils le TRAVERSENT, EN CHASSE OU NON (Keko : « quand un ennemi
   * rentre en contact avec le contour du portail, il doit obligatoirement être téléporté, même s'il a aggro le
   * joueur »). L'AGGRO : le joueur à moins de `aggro` d'un insecte — une GRANDE zone (« beaucoup plus importante ») —,
   * il le prend en chasse ; il ne LÂCHE que si LE JOUEUR part vraiment loin du portail, à plus de `lache` (d'abord une
   * laisse de 120 autour de l'endroit où il avait été pris : « l'ennemi ne doit quitter son aggro que si le joueur
   * part vraiment loin du portail ») ; il reprend alors sa marche, et ne se laisse plus distraire pendant `calme`
   * secondes. Au contact, il MORD (`morsure` points, toutes les
   * `cadenceMorsure` secondes). *Tous les chiffres sont de moi, à rejuger.*
   */
  invasion: { active: false as boolean, portail: 32, naissance: 360, vague: 4, renfort: 2, cadence: 2.2, cadenceMin: 0.15, /** Ce qui sépare deux insectes au plus près, au-delà de leurs rayons (voir `ecarterLesInsectes`). */ ecart: 1, repos: 6, premiere: 3, aggro: 170, lache: 260, calme: 2.5, morsure: 1, cadenceMorsure: 0.9,
    /**
     * (Keko, 14/11, la suite.) LA MORT N'EST PAS LA FIN : abattu, le joueur revient AU PORTAIL après `penalite` secondes
     * (le monde continue sans lui). LES PÉPITES que les insectes lâchent NE VONT PAS EN SOUTE : chacune vaut un point
     * d'expérience ; `xpBase` points pour le niveau 2, `xpPas` de plus à chaque niveau ; un niveau gagné s'annonce
     * (`niveau`) — la page met alors le jeu en pause pour le choix d'un talent.
     */
    penalite: 10, xpBase: 5, xpPas: 3, /** Ce que vaut l'expérience d'une pépite, en part (les cartes « Expérience » le grandissent). */ gainXp: 1,
    /**
     * LE RETOUR, SANS PORTAIL (Keko, 21/11 : « on ne devrait pas faire respawn le vaisseau au milieu de la map, mais là où
     * il est mort ; mort dans le vortex, en dehors de la zone, au coin de la zone le plus proche ; on garde le compteur et
     * dix secondes ; pendant le compteur, une zone circulaire autour de lui, et tous les ennemis dedans, à part les boss et
     * les mini-boss, sont détruits au respawn — une explosion de lumière ; puis deux secondes d'invincibilité complète,
     * une animation dorée en bouclier ; il traverse tout ; à la fin, il ne doit pas rester bloqué dans un ennemi. Un peu
     * comme Spell Brigade ») : le point de retour est l'épave, ramenée à `marge` en deçà de la tempête (`pointDeRetour`) ;
     * au retour, tout ce qui n'est pas GRAND (ni boss, ni mini-boss, ni roche qui dérive) à moins de `rayon` est abattu —
     * il lâche son expérience (Keko) — ; puis `invincible` secondes où rien ne le touche et où il passe au travers de
     * tout ; à leur fin, ce qui le recouvre est écarté (`degager`). Le rayon (110) choisi par Keko parmi trois.
     */
    // (`vitesse` : celle de la zone que le manche déplace pendant le compte — la moitié de la pointe d'un vaisseau ; de moi)
    retour: { rayon: 110, invincible: 2, marge: 60, vitesse: 55 },
    /**
     * LES VIES (Keko, 22/11 : « on a 5 vies au départ d'une partie, et à chaque fois qu'on est ressuscité, on consomme une
     * vie ; quand toutes les vies ont été épuisées, c'est game over ») : COMMUNES À L'ÉQUIPAGE (Keko) — chaque retour, de
     * qui que ce soit, en prend une. Seul, abattu sans vie, la partie est finie. À PLUSIEURS, LE RETOUR N'EST PLUS
     * AUTOMATIQUE (Keko : « il faut qu'un autre joueur se trouve dans le cercle doré du joueur qui est mort pour lancer le
     * compteur des 10 secondes ; à chaque fois qu'un allié ressort du cercle, le compteur bloque et s'arrête ») : le compte
     * n'avance que tant qu'un allié en vol est dans le cercle (`retour.rayon`, voir `alliesAuRetour`) ; sans vie, il
     * n'avance plus. Tous abattus à la fois, la partie est finie, qu'il reste des vies ou non (Keko). 0 : sans limite.
     */
    vies: 5,
    /** La part de leur poussée avec laquelle les insectes errent, le joueur abattu (voir `conduireLInsecte`). *De moi.* */
    errance: 0.45,
    /**
     * LE CORNU, L'INSECTE DE MILIEU DE GAMME (Keko, 21/11 : « un nouveau type d'insecte, milieu de gamme, un peu plus
     * résistant et plus gros que les petits » — un scarabée cornu blindé ; ×3 de vie et ×1,5 de taille ; après une minute,
     * de plus en plus souvent ; choisis parmi trois) : `vie` fois les points de vie d'un insecte, `taille` fois son rayon,
     * `vitesse` fois sa pointe et sa poussée, `morsure` fois sa morsure, `butin` pépites. Sa part dans le flot : rien avant
     * `debut` secondes de vol, puis elle monte en ligne droite jusqu'à `part` en `montee` secondes.
     */
    cornu: { vie: 4, taille: 1.5, vitesse: 35 / 40, morsure: 1.5, butin: 16 / 3, debut: 60, montee: 240, part: 0.2 },
    /**
     * LE MOUCHERON, LE MENU FRETIN (Keko, 21/11 : « des ennemis encore plus petits que les plus petits, vraiment des trash ;
     * en revanche un peu plus rapides » — un moucheron ; « ¼ de vie, ×0,6 de taille, vitesse 52 » ; « dès le début, en
     * nombre » ; choisis parmi trois) : `butin` peut être fractionnaire — une pépite une fois sur deux.
     */
    moucheron: { vie: 0.25, taille: 0.6, vitesse: 52 / 40, morsure: 0.5, butin: 0.25, debut: 0, montee: 1e-6, part: 1 / 3 },
    /**
     * LE CUIRASSIER, L'INSECTE BLINDÉ (Keko, 21/11 : « un troisième type d'ennemi blindé, plus gros et plus résistant encore
     * que le scarabée » — « un cuirassier à plaques », « ×10 de vie, ×2,2 de taille », « après trois minutes, rare » ;
     * choisis parmi trois) : les mêmes champs que le cornu.
     */
    cuirassier: { vie: 15, taille: 2.2, vitesse: 28 / 40, morsure: 2.5, butin: 21, debut: 180, montee: 300, part: 0.04 },
    /**
     * LES TROIS PÉPITES (Keko, 21/11 : « différentes pépites, une petite, une moyenne et une grosse, afin que les ennemis
     * lootent des ensembles un peu plus variés » — « 1 / 3 / 10 », « chaque ennemi a son butin propre ») : leurs valeurs
     * en points d'expérience, de la plus grosse à la plus petite. Un butin se paie avec les plus grosses d'abord
     * (`gemmesDuButin`) : le moucheron et le petit, une petite ; le cornu, une moyenne ; le cuirassier, une grosse ; une
     * roche qui dérive, selon sa taille — et ce qu'elle rend, on le voit serti dans sa pierre.
     */
    gemmes: [10, 3, 1],
    // (LE RENDEMENT MONTE AVEC LA TAILLE — Keko, 21/11 : « pas terrible que le moucheron ait un rendement plus haut que
    // les autres ennemis ; plus l'ennemi est gros, plus son rendement devrait être important, sans écart énorme ; et les
    // astéroïdes plus rentables que les ennemis par PV » — « monter les gros », choisi parmi deux : en pépites pour 100
    // PV, le moucheron 0,83 (butin 0,25 : une fois sur quatre), le petit 1 (1,2 — `butinRendu` du vortex), le cornu 1,11
    // (4), le cuirassier 1,17 (14), les roches 1,67 (`derive.pepitesParPv`) ; c'était 1,67 / 0,83 / 0,83 / 0,83 / 1,67)
    // (… ET LES GROS PLUS DURS, LEUR BUTIN AVEC — Keko, 21/11 : « augmenter les PV des mobs plus forts que le ×1 et
    // augmenter les pépites en conséquence » — « cornu ×4, cuirassier ×15 », choisi parmi trois : le cornu 480 PV et 5,33
    // pépites (une moyenne et deux petites, une troisième une fois sur trois), le cuirassier 1 800 PV et 21 ; leurs
    // rendements ne bougent pas — c'était ×3 et 4, ×10 et 14)
    /**
     * L'AIMANT (Keko, 21/11 : « que les ennemis aient une faible chance de looter un petit symbole de la couleur des
     * pépites, un symbole d'aimant ; quand on le prend, ça attire toutes les pépites de la map » — « 1 sur 300 ») : la
     * chance qu'un insecte abattu le lâche ; ramassé, toutes les pépites du monde sont aimantées vers le joueur.
     */
    aimant: 1 / 300,
    /**
     * LE SOIN (Keko, 22/11 : « un dernier drop des ennemis : une petite chance, un peu comme l'aimant, de looter un truc
     * qu'on peut ramasser et qui soigne du blindage — ou de la carapace pour les Xénoïdes ; comme une potion de soin ») :
     * la chance qu'un insecte abattu le lâche, et la part du blindage qu'il rend. Il ne va qu'à qui est blessé ; personne,
     * il attend. (1 SUR 500 — Keko, 22/11 : « trop élevé ; il faut que le soin tombe moins souvent que l'aimant » ; 1 sur 200
     * avant ; le quart du blindage plein de qui le ramasse, confirmé.)
     */
    soin: { chance: 1 / 500, part: 0.25 },
    /**
     * LA PLAQUE QU'UN INSECTE FAIT TOMBER (Keko, 23/11 : « faire dropper les plaques de surblindage de l'Empire par les
     * ennemis au lieu des astéroïdes » — voir `recuperation`) : la chance d'un insecte ordinaire, FOIS SA VIE (le
     * moucheron un quart, le cornu 4, le cuirassier 15 : un insecte plus dur à abattre en lâche plus souvent) —
     * 0,4 %, 0,1 %, 1,6 %, 6 %. Seul un vaisseau à plaques en fait tomber. *Les chiffres sont de moi.*
     */
    plaque: 1 / 250,
    /**
     * LES POINTS D'UN ABATTU (Keko, 22/11 : « chaque monstre aura un score en points ») : le petit insecte, le moucheron,
     * le cornu, le cuirassier ; une roche, `roche` points par unité de rayon (au moins `rocheMin`). Ne compte que LE COUP
     * FATAL, au pilote qui le porte (voir `Monde.tableau`). *De moi, à rejuger.*
     */
    points: { insecte: 2, moucheron: 1, cornu: 5, cuirassier: 15, roche: 0.25, rocheMin: 2 },
    /**
     * LA RÉCOMPENSE DE FIN DE PARTIE, EN CRÉDITS (Keko, 22/11 : « une récompense qui dépend du niveau, commun, mais unique
     * pour chaque joueur, car elle prend en compte ses kills — chaque monstre un score en points — et les astéroïdes qu'il a
     * détruits ; les mini-boss et les boss au nom de l'équipe ; au minimum une centaine de crédits ; à un niveau 100 où on
     * a fait pas mal de choses, plusieurs milliers ») — voir `recompenseDeFin` : le niveau, `parNiveau` × niveau et
     * `carreNiveau` × (niveau − 1)² (il compte de plus en plus). PLUS DE PRIME DE PARTIE (Keko, 22/11 : « avec le niveau 1,
     * très facilement atteignable, on a déjà un peu de crédit » ; « on n'a pas envie que les joueurs créent des parties et
     * les arrêtent à l'infini pour gagner la prime ») : une partie vide ne rapporte que son niveau 1 ; `parPoint` crédit par point d'insecte ;
     * `parPointDeRoche` par point de roche ; `miniBoss` et `boss` chacun, à toute l'équipe. *De moi, à rejuger.*
     */
    recompense: { parNiveau: 10, carreNiveau: 0.25, parPoint: 0.1, parPointDeRoche: 0.5, miniBoss: 100, boss: 400 },
    /**
     * LA VIE DU PORTAIL (Keko, 14/11 : « elle s'exprime en pourcentage : il commence à 100 %, et s'il atteint 0 c'est
     * la fin de la partie ; pour l'instant les ennemis lui enlèvent 1 % à chaque fois qu'ils passent ») : `viePortail`
     * au départ, `degatsAuPortail` par insecte qui le traverse. À zéro, la partie est FINIE (`fin`) : plus rien n'avance.
     */
    viePortail: 100, degatsAuPortail: 1,
    /**
     * UNE VAGUE VIENT D'UN SEUL CADRAN (Keko, 14/11 : « les ennemis attaquent parfois de deux côtés en même temps ; tout
     * seul, protéger les deux côtés, c'est quasiment impossible. Tu prends le vortex, tu t'en sers de centre pour
     * diviser la carte, ça te donne 4 cadrans : il faudrait que les ennemis arrivent d'un cadran à la fois au sein
     * d'une même vague. Lorsqu'il y a 2, 3 ou 4 joueurs — 4 au maximum —, on rajoute un cadran supplémentaire ») :
     * `joueurs` dit combien de cadrans une vague occupe (un par joueur, quatre au plus) ; ils sont tirés au début de
     * la vague, jamais le même que le premier de la vague d'avant quand il y a le choix.
     */
    joueurs: 1,
    /**
     * SANS PORTAIL (le jeu du vortex — Keko, 20/11 : « on va supprimer le portail ; les ennemis apparaissent toujours hors
     * du champ de vision du joueur, mais foncent sur le joueur pour l'attaquer ; on est vraiment sur un Vampire
     * Survivors-like, avec de plus en plus d'ennemis au fur et à mesure que la partie avance ») : `sansPortail` — les
     * insectes naissent sur le cercle de naissance AUTOUR DU VAISSEAU (dans les cadrans de la vague, autour de lui), le
     * chassent tous dès leur naissance et ne le lâchent jamais ; personne ne traverse plus rien ; les roches qui
     * dérivent traversent le champ autour de lui. LES INSECTES ÉVITENT LES ROCHES : ils s'en écartent à moins de
     * `eviteRoche` de leur bord ; un insecte qui en heurte une quand même la heurte comme le vaisseau — tous deux
     * perdent `derive.chocInsecte`, une fois par `heurteRoche` secondes.
     */
    sansPortail: false as boolean,
    /**
     * UN FLOT CONTINU, PLUS DE VAGUES (Keko, 20/11 : « je ne veux pas que les ennemis spawnent par vagues, on arrête ça ;
     * on fait un spawn continu, de plus en plus soutenu ») : `continu.actif` — un insecte naît tout autour du centre du
     * champ (plus de cadrans), au rythme de `debut` par seconde, qui monte de `montee` par minute de vol jusqu'à `max` ;
     * jamais plus de `vivantsMax` insectes à la fois. *Les chiffres sont de moi.*
     */
    // (… ET FUIR NE SERT À RIEN — Keko, 20/11 : « un joueur qui fonce tout droit à l'infini esquive très facilement les
    // ennemis » — le vaisseau va deux fois et demie plus vite qu'eux : `devant` — quand il file (plus de 20 par seconde),
    // cette part des naissances se fait DANS SON AXE DE VOL, à ±`cone` radians ; `recycle` — un insecte resté à plus de
    // tant du vaisseau RÉAPPARAÎT hors de vue, devant lui (la règle de Vampire Survivors). *Chiffres de moi.*)
    // (… ET LE TRAÎNARD NE REVIENT PAS EN CERCLE — Keko, 20/11 : « quand je meurs et que je respawn, tout un cercle
    // d'ennemis apparaît autour de moi dans toutes les directions ; ça fait pas très organique » : revenu au centre, toute
    // la meute était traînarde et réapparaissait d'un coup, à la même distance, tout autour. Vaisseau lent, le traînard
    // revient DU CÔTÉ OÙ IL ÉTAIT, à ±`cone` ; à toute vitesse, devant comme avant ; et à une distance étalée de la
    // naissance jusqu'à `etalement` de plus — sous `recycle`, sinon il repartirait aussitôt)
    continu: { actif: false as boolean, debut: 0.5, montee: 0.5, max: 6, vivantsMax: 120, devant: 0.6, cone: 0.9, recycle: 460, etalement: 0.2 },
    eviteRoche: 24,
    /**
     * LES INSECTES ÉVITENT LA TEMPÊTE, TOUJOURS (Keko, 21/11 : « quand je meurs, les ennemis se dispersent et vont dans le
     * vortex ; on veut absolument éviter ça ; il faut toujours que les ennemis évitent le vortex ») : à moins de
     * `eviteTempete` de son bord, l'insecte est repoussé vers le centre, d'autant plus qu'il en est près — en chasse comme
     * quand il erre. *De moi.*
     */
    eviteTempete: 90,
    /** EN CHASSE, l'insecte va jusqu'au bord de la tempête : sur cette distance avant lui, il perd la part de sa course qui y entre (Keko, 22/11 — voir `conduireLInsecte`). *De moi.* */
    approcheDuBord: 30,
    heurteRoche: 0.6,
  },
  /** Le manche, en pixels CSS : son rayon (au bord, la pleine poussée), sa zone morte. */
  manche: { rayon: 56, mort: 0.12 },
  champ: {
    /** La taille d'une case du monde ; une case sur deux environ porte un astéroïde. */
    case: 110,
    densite: 0.55,
    rayonMin: 5,
    rayonMax: 14,
    /** Autour du point de départ, rien : le joueur apprend le manche à vide. */
    vide: 70,
    /**
     * LA GRAINE DU CHAMP (Keko, 11/11 : « l'espace est randomisé ? j'ai l'impression de tomber sur la même map » —
     * « je propose de randomiser à chaque vol pour l'instant, histoire de tester ») : zéro, c'est le champ de toujours ;
     * une autre graine en fait un AUTRE champ, tout aussi déterministe (la page en tire une à chaque décollage — le
     * hasard reste hors de `logic/`, il lui est injecté).
     */
    graine: 0,
  },
  /**
   * LE FORAGE : le laser vise seul ce qui est le plus proche à portée et le creuse à tant de points par seconde ;
   * une roche a `durete × rayon²` points ; éclatée, elle laisse des pépites (tant par unité de rayon) qui viennent
   * au vaisseau le plus proche à portée d'aimant, et comptent une fois à bord.
   */
  forage: { portee: 64, debit: 28, durete: 0.6, pepitesParRayon: 0.45, aimant: 44, vitessePepite: 160, ramassage: 5, /** UN SOIN, UNE PLAQUE, UN AIMANT — qui ne s'aimantent pas — se prennent à tant AU-DELÀ DE LA COQUE (Keko, 23/11 : « parfois je le touche, mais si je suis pas exactement dessus, je le ramasse pas » : 9, au lieu de 3). */ margeDesObjets: 9, /** Une pépite aimantée par le joueur : de combien sa vitesse monte chaque seconde (voir « une pépite aimantée »). */ accelerationAimantee: 400 },
  /**
   * LA BOMBE, la première CAPACITÉ ACTIVE (Keko, 12/11 : « une action un peu puissante, soumise à un nombre de charges
   * par vol ») — une capacité d'ESSAI, pour juger le geste : tant de charges par vol ; lancée, elle file à tant d'unités
   * par seconde (plus la moitié de l'élan du vaisseau), vit tant de secondes, et ÉCLATE au bout ou au premier contact
   * d'une roche ou d'un rival : toute roche à tant d'unités de sa surface éclate (ses pépites restent), tout rival dans
   * ce rayon prend tant de dégâts. Elle ne blesse pas le joueur.
   */
  // (ELLE VA PLUS OU MOINS LOIN selon la force du geste — Keko : « envoyer la bombe plus ou moins loin en fonction du
  // niveau dans lequel le joueur pousse le joystick » : de `pres` à 1 fois sa portée, `tape` sans glissement)
  bombe: { charges: 3, vitesse: 170, vie: 0.6, rayon: 44, degats: 80, pres: 0.25, tape: 0.5 },
  /**
   * L'ENNEMI : il apparaît à tant de secondes puis tant après sa mort, à tant d'unités (hors de l'écran le plus haut, 180
   * sur 480, avance de caméra comprise : à 200, Keko le voyait « apparaître de nulle part ») ; il a tant de points (le laser
   * du joueur les creuse comme une roche), pousse et va moins vite que le joueur ; il cherche une roche à tant de LUI, parmi celles à tant du joueur (il RÔDE : il mine là où il est, mais
   * sans s'éloigner — Keko, 09/11 : « je trouve l'ennemi trop présent » : il venait miner exprès dans le coin du joueur, à
   * 150, et ne le lâchait plus ; sans laisse du tout, de roche en roche il était à 570 au bout de 25 s, perdu) ; il
   * voit le joueur à tant, se tient à tant de lui, et tire toutes les tant de secondes des traits à tant d'unités par
   * seconde qui vivent tant ; UNE EXTRACTION EN COURS, il la voit de plus loin (`accourt`) et vient (les dix secondes
   * à quai doivent être une menace, pas une formalité) ; un trait enlève un point de coque. CHARGÉ de tant de pépites,
   * IL FUIT au lieu de chasser (Keko, 09/11 : « les vaisseaux ennemis avec beaucoup de ressources fuient le joueur, avec
   * peu le poursuivent ») : plein gaz à l'opposé dès qu'il voit le joueur, jusqu'à tant (hors écran, sinon il oscillait
   * au bord de sa vue), sans tirer — il va moins vite, on peut le rattraper, et abattu il rend tout ce qu'il porte. SON LASER NE SERT QU'À MINER (Keko, 08/11 : essayé
   * en arme à portée de forage, les deux rayons se superposaient en face à face — « on va juste empêcher l'ennemi
   * d'utiliser le laser de manière offensive »). Abattu, il rend son butin plus tant de pépites.
   */
  /**
   * L'ARÈNE ET SA TEMPÊTE (le jeu du vortex — Keko, 20/11 : « on va partir sur une arène circulaire ; pour marquer
   * visuellement le contour, une tempête circulaire tout autour de la zone, dans laquelle des particules et des
   * astéroïdes tournent assez vite ; si le joueur va dans la zone de la tempête, il risque de se faire frapper par les
   * astéroïdes, et de toute façon il subit des dégâts sur la durée à cause de l'énergie ») : éteinte hors du vortex. Le
   * jeu se tient dans un cercle de `rayon` autour du centre du monde ; au-delà, sur `largeur`, LA TEMPÊTE : le vaisseau
   * y perd `dps` unités de vie par seconde (DROIT AU BLINDAGE depuis le 21/11 — voir `blesserParLaTempete` ; déphasé,
   * rien ne le touche, comme ailleurs), et `roches`
   * roches de `rocheMin` à `rocheMax` y tournent autour du centre, à `vitesse` le long du cercle — une roche qui le
   * heurte lui coûte `choc` unités de vie et l'emporte. Au bord extérieur, rien ne passe : le vaisseau et les insectes y
   * sont retenus. Les insectes ne naissent et ne reviennent que dans l'arène, à `marge` de la tempête. *Les chiffres
   * sont de moi.*
   */
  // (… ET ELLE RETIENT CE QUI S'Y ENFONCE — Keko, 21/11 : « quand les vaisseaux vont dans le vortex, qu'ils soient de plus
  // en plus ralentis du moment qu'ils vont vers l'extérieur, pour empêcher de sortir de l'autre côté » : dans la tempête,
  // la vitesse VERS L'EXTÉRIEUR est plafonnée à `vitesseMax` fois la part qui reste devant lui de la `retenue` de la
  // tempête (ses six dixièmes) — rien au-delà : on s'arrête en douceur dans la tempête, loin de son bord, au milieu de
  // ses roches ; tourner et revenir vers l'arène restent libres)
  /**
   * L'ÉQUIPAGE (à plusieurs dans un même monde — voir `avancerLEquipage`) : deux vaisseaux ne s'éloignent pas de plus de
   * `laisse` l'un de l'autre — ils restent ensemble à l'écran, la caméra entre eux. *De moi.*
   */
  equipage: { laisse: 220 },
  arene: { active: false as boolean, rayon: 1000, largeur: 220, dps: 0.6, roches: 110, rocheMin: 7, rocheMax: 24, vitesse: 150, choc: 2, marge: 30, retenue: 0.6 },
  /**
   * LES ASTÉROÏDES QUI DÉRIVENT (le jeu du vortex — Keko, 20/11 : « un système d'astéroïdes un peu comme avant : chaque
   * astéroïde lâche des pépites, les mêmes que les ennemis ; mais ils dérivent : de temps en temps on fait passer des
   * astéroïdes qui avancent plus ou moins lentement — certains vite, d'autres plus lentement, ce qui peut aussi
   * représenter un danger de collision ; si le joueur les détruit, il récupère un nombre important de pépites — le ratio
   * est meilleur que sur les ennemis ; en revanche, on cible en priorité les ennemis : pour détruire un astéroïde, il faut
   * être loin des ennemis, sans ennemi à portée, ou utiliser le verrouillage ») : éteints hors du vortex. Toutes les
   * `tousMin` à `tousMax` secondes (le premier à `premier`), `max` à la fois au plus, une roche de `rayonMin` à `rayonMax`
   * naît sur un cercle à `marge` au-delà de celui des insectes et TRAVERSE LE CHAMP en ligne droite, vers un point tiré à
   * moins de `visee` du portail, à `vitesseMin`–`vitesseMax` ; elle quitte le monde une fois repassée à `marge` au-delà.
   * C'EST UN ENNEMI D'UN GENRE À PART (`Ennemi.asteroide`) : toutes les armes la frappent, elle ne mord ni ne marche au
   * portail, et LES ARMES NE LA VOIENT PAS tant qu'un insecte est à portée du vaisseau (voir `rochesMasquees`), sauf
   * verrouillée. Elle a `pvA10` points à 10 de rayon, à la puissance `exposant` du rayon (un rayon tiré de 8 à 46, voir `tailles` —
   * Keko, 20/11 : « varie davantage la taille des astéroïdes, ils sont trop petits et tous d'une taille trop similaire » ;
   * c'était 6 à 13, et 5 × rayon² : une grosse roche aurait demandé une minute) ; détruite, elle lâche `pepitesParPv` pépite par point de vie (un
   * insecte, une pour 120) ; elle heurte le vaisseau de `choc` unités de vie. *Les chiffres sont de moi, à rejuger.*
   */
  derive: { active: false as boolean, /** Ce que garde un choc entre deux roches qui dérivent (voir `heurterLesDerives`). */ rebond: 0.6, premier: 12, tousMin: 8, tousMax: 16, max: 3, marge: 60, visee: 200, rayonMin: 8, rayonMax: 46, vitesseMin: 10, vitesseMax: 42, pvA10: 500, exposant: 2, pepitesParPv: 1 / 60, choc: 2, chocInsecte: 60,
    /**
     * LES TAILLES (Keko, 21/11 : « rendre les gros astéroïdes un peu plus rares ; on en fait vraiment de toutes les
     * tailles ; plus on avance dans la partie, plus les gros deviennent un peu plus fréquents, mais pas tout le temps ;
     * les gros vraiment durs à détruire et qui donnent vraiment beaucoup de pépites ; le plus gros, encore plus gros ») :
     * une GÉANTE (de `geante` à `rayonMax`) — AUCUNE AVANT `apres` secondes de vol (Keko, 21/11, au test des géantes :
     * « le test est très bon, on valide ; remets les astéroïdes de taille normale ; les géants ne doivent apparaître que
     * tard dans la partie ») — naît ensuite à `partDebut`, cette part montant jusqu'à `partFin` en `montee` secondes ;
     * sinon une roche COURANTE, de `rayonMin` à `courante`, toutes tailles (u^k) — LES PETITES DOMINENT AU DÉPART (Keko,
     * 21/11 : « trop de gros astéroïdes dès le départ ») : k passe de `kDebut` à `k` en `montee` secondes (une roche de
     * plus de 24 : 14 % au départ, 27 % ensuite — c'était 27 % dès le départ). Et les points à la puissance 2
     * du rayon (1,5 avant), le butin suivant : la plus grosse, 46 de rayon (34 avant), 10 580 points et 176 d'expérience
     * (3 135 et 52 pour celle de 34 avant). *Les chiffres sont de moi.*
     */
    tailles: { courante: 32, geante: 36, kDebut: 2.6, k: 1.3, montee: 420, apres: 480, partDebut: 0.03, partFin: 0.1 } },
    // (LES ROCHES NE FONT PLUS TOMBER DE PLAQUES — Keko, 23/11 : ce sont les insectes, voir `invasion.plaque` ; elles en
    // donnaient de 1 % pour la plus petite à 5 % pour la plus grosse)
  ennemi: { apparait: 10, revient: 5, distance: 320, pv: 36, poussee: 120, vitesseMax: 85, rotation: 5, rayon: 4, cherche: 260, rode: 450, voit: 130, accourt: 420, tient: 80, fuit: 10, lache: 260, cadence: 1.8, vitesseTir: 130, dispersion: 0.16, vieTir: 2, butinRendu: 3,
    /**
     * LE RIVAL PEUT PORTER DE VRAIES ARMES (Keko, 14/11 : « deux canons, le reste en mitraillette, et deux missiles dans
     * ses slots lourds ») : celles du joueur — chacune tire à SA cadence, à sa portée (bornée par ce que le rival voit),
     * avec ses obus ; les missiles tournent vers le joueur. Vide : le tir unique d'avant (`cadence`, `vitesseTir`).
     * `partDesDegats` : ce qu'un point de dégât d'arme enlève au blindage du joueur — les armes sont réglées contre les
     * 36 points du rival, le joueur en a cinq : un obus de canon (6) lui enlève un point.
     */
    armes: [] as Arme[],
    partDesDegats: 1 / 6,
    /** Un missile du rival tourne vers le joueur à tant de rad/s (moins que ceux du joueur : il s'esquive). */
    guidage: 2.2,
  },
} as const
/** La configuration, les nombres élargis : une page peut en passer une variante (`&ennemi` fait naître l'ennemi tout de suite). */
type Large<T> = { [K in keyof T]: T[K] extends number ? number : T[K] extends object ? Large<T[K]> : T[K] }
export type ConfigVaisseau = Large<typeof VAISSEAU>
/** Le manche du vaisseau dans la langue du survivor (sa vitesse et sa réponse n'y servent pas). */
export const MANCHE: ConfigSurvivor = { vitesse: 0, reponse: 0, manche: VAISSEAU.manche }

/** Une arme du joueur : sa cadence, ce que fait un coup, sa portée, la vitesse et la vie de ses obus, leur dispersion ; guidée, l'obus tourne vers le rival. */
export type Arme = {
  id: string
  /** LE CRITIQUE PROPRE À L'ARME (Keko, 22/11 : « le critique de chaque arme propre à l'arme ») : des points de chance et de facteur, ajoutés à ceux du vaisseau — voir `chanceDeCritique`. */
  critique?: number
  critiques?: number
  cadence: number
  degats: number
  portee: number
  vitesse: number
  vie: number
  dispersion: number
  guide: boolean
  /** La place où elle est montée (0 : l'aile gauche, 1 : la droite), posée par le hangar. */
  place?: number
  /**
   * SA BOUCHE, en unités du vaisseau (x vers le nez, y vers la droite), posée par le rendu qui la dessine : ses obus
   * en partent (Keko, 12/11 : « que les projectiles des armes partent de l'endroit réel où se trouve la pièce »). Sans
   * elle, ils partent du bord du vaisseau, vers la cible.
   */
  bouche?: Vecteur
  /**
   * UN LANCE-FLAMMES (la Salamandre, Keko, 15/11 : « un vaisseau en mode lance-flammes qui arrose à courte portée avec
   * des dégâts importants ») : pas d'obus — UN CÔNE CONTINU devant la bouche, de demi-angle `cone`, jusqu'à `portee` ;
   * tout ce qui s'y trouve perd `degats` PAR SECONDE, et BRÛLE ENCORE `brulure` secondes à `dpsBrulure` par seconde.
   * Il crache dès qu'un ennemi est dans le cône.
   */
  flamme?: { cone: number; brulure: number; dpsBrulure: number; /** UNE SEULE CIBLE : la plus proche dans le cône (le chalumeau). */ seul?: boolean }
  /**
   * UN DRONE (la Sentinelle, Keko, 15/11 : « entourée de petits drones qui attaquent indépendamment » ; puis « qu'ils
   * partent eux-mêmes de leur position pour voler autour de l'ennemi et l'attaquer, et qu'ils reviennent sur le
   * vaisseau une fois l'ennemi mort ») : l'arme n'est pas sur le vaisseau, c'est un petit engin (`Monde.drones`, mené
   * par `menerLesDrones`). Au repos, il tient SA PLACE sur une orbite autour du vaisseau — à `rayon`, à `vitesse`
   * rad/s, partie de `phase` ; un ennemi à moins de `laisse` du vaisseau, il PART : il vole jusqu'à lui (à `vol` au
   * plus, en tournant de `braquage`) et lui TOURNE AUTOUR à `autour`, `tour` rad/s, en tirant de là à sa cadence ;
   * l'ennemi mort ou trop loin, il en prend un autre, ou il revient à sa place.
   */
  // (… OU EN FORMATION — l'Escorte de l'Empire, Keko, 23/11 : « au lieu de tourner autour du chasseur, qu'elle vole à ses
  // côtés et suive son orientation quand il n'y a pas d'ennemis » : `formation`, sa place au repos dans le repère du
  // vaisseau — x vers le nez, y vers la droite —, qui tourne avec lui ; l'orbite ne sert plus)
  // (… ET DES AILIERS QUI NE LE QUITTENT PAS — Keko, 23/11, pour la distinguer des drones de la Sentinelle : « on essaie »
  // l'escorte qui reste toujours en formation, pivote vers sa cible et tire de plus loin, sans partir chasser : `ailier`
  // — il tient sa place même en combat ; sa cible est un insecte à SA portée de tir, mesurée de lui)
  orbite?: { rayon: number; vitesse: number; phase: number; laisse?: number; vol?: number; braquage?: number; autour?: number; tour?: number; formation?: Vecteur; ailier?: boolean }
  /**
   * DES TOURELLES POSÉES (l'Ingénieur, Keko, 15/11 : « quelque chose de mécanique, carré, qui pose des petites tours sur
   * son passage ») : l'arme n'est pas sur le vaisseau, il la POSE dans le monde (`Monde.tourelles`, `menerLesTourelles`)
   * — une tourelle toutes les `tous` secondes au plus, là où il passe, à `ecart` au moins de la plus proche (immobile, il
   * n'en pose pas d'autre) ; `max` à la fois (la plus vieille saute), chacune vit `duree` secondes. Une tourelle pivote
   * (`pivot` rad/s) vers l'ennemi le plus proche à sa portée — le verrouillé d'abord — et tire à la cadence de l'arme.
   */
  pose?: { tous: number; ecart: number; max: number; duree: number; pivot: number; /** (LANCÉE — Keko, 15/11) : à quelle distance, et en combien de temps de vol. */ jet: number; vol: number }
  /**
   * UNE EXPLOSION (les mini-missiles du chasseur, Keko, 15/11 : « quand le missile touche l'ennemi, il explose et peut
   * toucher les ennemis aux alentours — un côté zone d'effet qu'aucun autre projectile n'a ») : à l'impact — ou au bout
   * de sa course —, tout autre ennemi à moins de `rayon` perd `degats`.
   */
  // (… LES MÊMES DÉGÂTS DANS TOUTE LA ZONE — Keko, 20/11 : « ne sépare pas les dégâts du missile et les dégâts de zone ;
  // les mêmes dégâts dans toute la zone, peu importe que l'ennemi soit touché directement ou par la zone » : plus de
  // `degats` à elle, ce sont ceux de l'arme)
  // (… OU UNE PART DE SES DÉGÂTS — la carte « Impulsion » du canon laser, Keko, 23/11 : « une petite zone de dégâts autour des
  // cibles du laser ; la zone inflige un pourcentage des dégâts du projectile ou de la concentration totale du laser » :
  // `part`, ce que la zone inflige des dégâts du tir — tout, sans elle)
  zone?: { rayon: number; part?: number }
  /**
   * DU NAPALM (la Salamandre, Keko, 15/11) : le tir est une boule de gel LANCÉE EN CLOCHE vers la cible — elle passe
   * au-dessus des insectes et retombe là où la cible sera — et y laisse UNE FLAQUE DE FEU (`Monde.flaques`) de `rayon`,
   * `duree` secondes : tout insecte dedans perd `dps` par seconde, et brûle encore `brulure` s à `dpsBrulure` en sortant.
   */
  napalm?: { rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }
  /**
   * TIRÉ EN CLOCHE (l'Obusier de l'Empire, Keko, 23/11 : « que l'obus soit tiré en cloche pour le distinguer un peu des
   * missiles ») : comme la boule de napalm, l'obus vole juste le temps d'atteindre la cible — là où elle sera —, passe
   * au-dessus de tout en vol, et n'explose (sa `zone`) qu'en retombant.
   */
  // (… ET LENTEMENT — Keko, 23/11 : « l'obus est toujours trop rapide à toucher sa cible ; je veux vraiment une cloche
  // assez lente » : son vol dure `vol` secondes DE PLUS que la distance à la `vitesse` de l'arme — même tout près, il
  // prend son temps — ; sa vitesse au sol en découle, pour retomber pile là où sera la cible)
  cloche?: { vol: number }
  /**
   * À RETARDEMENT (le Lance-grenades de l'Empire, Keko, 23/11 : « l'idée du compte à rebours me plaît beaucoup : trois
   * petites grenades, qui clignotent en rouge pour indiquer le timer, et leur clignotement s'intensifie jusqu'à
   * exploser » — sans rebond : « on est dans l'espace ; seul l'hypercube peut rebondir sur l'espace-temps ») : le tir ne
   * touche rien en vol ; lancé juste assez vite pour, freiné de `frein` par seconde, S'ARRÊTER là où sera sa cible au
   * bout de `duree` secondes, il y explose (sa `zone`). Le feu et le gel de ses cartes prennent toute la zone.
   */
  minuterie?: { duree: number; frein: number }
  /**
   * UN HARPON (la sixième arme de l'Empire, Keko, 23/11 : « on fait un test avec le harpon » — proposé : « il harponne
   * l'insecte le plus résistant à portée, le relie au vaisseau par un câble, et le câble lui inflige des dégâts qui
   * augmentent tant qu'il tient ; il casse si l'insecte meurt ou s'éloigne trop » ; l'arme anti-boss de l'Empire) : le
   * harpon part à `vitesse` vers sa cible — le verrouillé à portée, sinon L'INSECTE QUI A LE PLUS DE POINTS DE VIE à
   * portée, une roche seulement sans insecte — et la suit ; planté, le câble la ronge de `degats` par seconde, qui montent
   * en ligne droite jusqu'à `max` fois en `montee` secondes ; il casse quand elle meurt ou passe à plus de `rupture` fois
   * la portée, ou s'il ne l'a pas atteinte avant de parcourir deux portées ; la cadence est son délai de relance, cassé.
   * L'état est `Monde.harpons`. *Les chiffres sont de moi.* (EN SE PLANTANT, IL FRAPPE de `impact` fois ses dégâts : sans ce
   * coup, la montée du câble faisait traîner chaque petit insecte — mesuré, 0,28 sur la vague.)
   */
  harpon?: { vitesse: number; max: number; montee: number; rupture: number; impact: number }
  /**
   * UNE BALISE LASER (la sixième arme de l'Empire, Keko, 23/11 : « le vaisseau lance une balise, et durant tout le temps où
   * la balise est active, un rayon laser rouge est tracé entre la balise et le vaisseau ; tous les ennemis traversés par le
   * rayon subissent des dégâts, et ont une petite animation sur eux — un petit crépitement rouge ») : un insecte à portée,
   * la balise est lancée vers lui et un peu au-delà ; (EN DEUX TEMPS — Keko, 23/11 : « d'abord lancer la balise en cloche
   * quelque part, et qu'elle ne s'active qu'une fois posée, pas dès qu'elle est tirée : un temps où on pose la balise, un
   * temps où le rayon se déclenche ») ELLE VOLE EN CLOCHE `vol` secondes, ne touche rien, SE POSE, et alors seulement
   * elle s'active ; posée, elle vit `duree` secondes, une à la fois par arme ; pendant ce temps, LE RAYON DU VAISSEAU À ELLE frappe de `degats`
   * par seconde tout ce qui est à moins de `epaisseur` de lui — il balaie quand le vaisseau bouge. (TOUJOURS SA DURÉE
   * PLEINE — Keko, 23/11 : « j'ai l'impression que la durée de la balise est aléatoire » : il s'éteignait quand le vaisseau
   * s'en éloignait à plus de 1,8 portée, et on bouge sans cesse ; plus de coupure.) `explosion` (une carte) : à sa fin,
   * elle explose. L'état est `Monde.balisesLaser`. *Les chiffres sont de moi.*
   */
  lien?: { duree: number; vol: number; epaisseur: number; explosion?: { rayon: number; part: number } }
  /**
   * UN RAYON QUI BALAIE (la Salamandre, Keko, 15/11 : « un rayon à haute énergie qui part au-dessus du vaisseau et
   * descend en décrivant un cercle autour de lui : il enflamme et fait de gros dégâts ») : toutes les `tous` secondes, si
   * un ennemi est à portée, un rayon de `longueur` part du vaisseau vers le haut (`depart`, un angle du monde) et en
   * FAIT LE TOUR en `duree` secondes ; chaque ennemi qu'il balaie prend `degats` — une fois par tour — et s'enflamme
   * (`brulure` s à `dpsBrulure`). L'état du tour en cours est `Monde.balayage`.
   */
  // (… PUIS UN BALAYAGE QUI LAISSE UNE TRAÎNÉE DE FEU — Keko, 16/11 : « le rayon de la Salamandre devient un rayon qui balaie
  // et laisse une traînée de feu » : `arc` — l'angle balayé, un tour sans lui ; `vise` — l'arc centré sur l'insecte le
  // plus proche, le sens alternant d'un balayage à l'autre ; `trainee` — tous les `pas` radians, des flaques de feu (celles
  // du napalm) aux parts `distances` de sa longueur)
  // (… PUIS UN TRAIT AU SOL — Keko, 16/11 : « un truc qui part du toit du vaisseau, qui va vers le bas, qui ne touche pas
  // les ennemis touchés par le rayon mais l'endroit où le rayon touche le sol ; il vise un ennemi en traçant un trait qui le
  // touche, de devant vers le fond » : `trace` — le rayon descend sur le sol ; son POINT D'IMPACT parcourt en `duree` un
  // trait droit, de `avant` en deçà de l'insecte le plus proche (vu du vaisseau) à `apres` au-delà ; seul ce point frappe,
  // dans `rayon` ; la traînée y sème une flaque tous les `pas` de trait, sur le trait même)
  // (… PUIS EN TRAVERS — Keko, 16/11 : « on peut essayer perpendiculairement, le rayon fait la même chose mais de gauche à
  // droite » : `travers` — le trait passe sur l'insecte EN TRAVERS de la droite qui le joint au vaisseau, de `avant` à sa
  // gauche à `apres` à sa droite, vu du vaisseau)
  balayage?: { tous: number; duree: number; longueur: number; degats: number; brulure: number; dpsBrulure: number; depart: number; arc?: number; vise?: boolean; trace?: { avant: number; apres: number; rayon: number; travers?: boolean }; trainee?: { pas: number; distances?: number[]; rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number } }
  /**
   * UN RAYON CANALISÉ (le rayon thermique de la Salamandre, Keko, 15/11 : « un rayon comme celui qui sert à forer les
   * astéroïdes, permanent, qu'on canalise sur l'ennemi ») : il part d'une tourelle sur le toit et reste sur UNE cible à
   * portée — la verrouillée d'abord, sinon il garde la sienne, sinon la plus proche — ; il CHAUFFE : ses dégâts par
   * seconde montent de `dpsMin` à `dpsMax` en `montee` secondes sur la même cible ; ce qu'il touche brûle. L'état est
   * `Monde.canal`.
   */
  // (… PUIS DES DÉGÂTS FIXES — Keko, 20/11 : « pour le rayon du Prisme, celui qui se concentre sur un ennemi, je ne veux pas
  // de montée en puissance ; je veux que ses dégâts soient fixes » : `dps` par seconde, dès qu'il est sur sa cible ; plus
  // de `dpsMin`, `dpsMax` ni `montee`, et sa chauffe, à l'image, est toujours pleine)
  canalise?: { dps: number; brulure: number; dpsBrulure: number }
  /**
   * L'ÉLECTRICITÉ (la Sentinelle, Keko, 15/11 : « le vaisseau spécialisé dans l'électricité ») — `eclair` : un drone
   * ne tire plus d'obus, il frappe sa cible D'UN ARC ÉLECTRIQUE, à l'instant ; `chaine` : un éclair part du vaisseau sur
   * une cible à portée — la verrouillée d'abord, sinon la plus proche — et REBONDIT `rebonds` fois, sur l'ennemi le plus
   * proche du dernier touché à moins de `saut`, sans revenir sur un déjà touché, perdant `attenuation` à chaque bond ;
   * `aura` : tout ennemi à moins de `rayon` du vaisseau perd `dps` par seconde, sans cesse.
   */
  eclair?: boolean
  chaine?: { rebonds: number; saut: number; attenuation: number }
  aura?: { rayon: number; dps: number }
  /**
   * UNE SCIE CIRCULAIRE QUI REVIENT (l'Ingénieur, Keko, 15/11 : « une scie circulaire qui tourne ; on la lance et au bout
   * de sa trajectoire elle revient vers le vaisseau, comme un boomerang — en fonction de notre position au lancement et à
   * la réception, elle décrit un arc différent, et le placement du joueur devient stratégique ») : une cible à portée —
   * la verrouillée d'abord, sinon la plus proche —, il la LANCE vers elle ; elle file droit en ralentissant et s'arrête à
   * `portee` au bout de `aller` secondes, puis REVIENT vers le vaisseau, là où il est, en virant de `virage` (par
   * seconde) vers lui, jusqu'à `retour` de vitesse ; il la RATTRAPE au contact et la relance `cadence` secondes après.
   * Elle traverse tout : chaque insecte à moins de `rayon` d'elle prend `degats` une fois à l'aller, une fois au retour.
   * L'état est `Monde.scies`.
   */
  scie?: { aller: number; retour: number; virage: number; rayon: number }
  /**
   * DES BALISES-PIÈGES (l'Ingénieur, Keko, 15/11 : « il pose des balises sur son passage ; quand un ennemi passe entre
   * deux balises, chaque balise tire vers celle d'en face — des espèces de clous, de rivets —, l'ennemi en reçoit un de
   * chaque côté ; les balises servent de piège ») : il en POSE une là où il est, toutes les `tous` secondes au plus, à
   * `ecart` au moins de la dernière (immobile, il n'en pose pas) ; `max` à la fois (la plus vieille saute), chacune vit
   * `duree` secondes. LES BALISES VONT PAR TROIS, CHAQUE TRIO UN TRIANGLE (Keko, 15/11 : « 1, 2 et 3 forment un
   * triangle, ensuite 4, 5, 6 forment un triangle ; mais les deux triangles ne doivent pas être reliés ») : la deuxième
   * d'un trio est reliée à la première, la troisième à la deuxième ET à la première, à toute distance ; la première d'un
   * trio n'est reliée à rien. UN TRIANGLE S'ÉTEINT D'UN BLOC (Keko, 15/11 : « les trois balises d'un triangle
   * disparaissent simultanément, à la fin du temps de vie de la dernière balise du triangle ») : `duree` secondes après
   * la pose de sa dernière balise (`finDuTrio`) ; et quand il y en a plus de `max`, c'est le plus vieux triangle entier
   * qui saute. LA LIGNE S'ÉCLAIRE QUAND ON LA FRANCHIT (Keko, 15/11 : « à la place des deux projectiles, éclairer la
   * ligne à chaque fois qu'elle est franchie par un ennemi, et ils reçoivent des dégâts une fois ; si deux ennemis la
   * traversent quasiment en même temps, ils sont touchés tous les deux — voire deux fois s'ils sont encore sur la
   * ligne ; pas de temps de recharge ») : un insecte est SUR une ligne à moins de `garde` d'elle (plus son rayon),
   * entre ses deux balises ; chaque fois qu'un insecte y ENTRE, la ligne s'éclaire et TOUT INSECTE SUR ELLE prend
   * `degats` — sans recharge : deux qui entrent ensemble, chacun prend deux coups. ET ELLE CONTINUE DE DÉCHARGER (Keko,
   * 15/11 : « tant que l'ennemi est dedans, quitte à le toucher plusieurs fois — comme une clôture électrique qu'on
   * continuerait de toucher ») : tant qu'un insecte est dessus, elle se décharge encore toutes les `periode` secondes
   * depuis sa dernière décharge.
   */
  // (… ET DES CRISTAUX RELIÉS PAR DES FAISCEAUX, la deuxième arme du Prisme — Keko, 16/11 : « on réutilise notre système
  // de balises : on place des cristaux reliés par des faisceaux d'énergie ; dès qu'un ennemi le traverse, le faisceau s'active
  // et lui inflige des dégâts » : `irradie` — au lieu d'un coup à chaque décharge, la ligne IRRADIE ce qui est dessus,
  // `dps` points par seconde TANT QU'IL Y EST, et rien après (Keko, 16/11 : pas de dégâts sur la durée) ; `devant` — posé à
  // cette distance devant le vaisseau, là où est le cristal de sa proue : « comme s'il était déposé depuis le cristal de devant »)
  // (… ET LES CRISTAUX SANS NOMBRE MAXIMUM — Keko, 20/11 : « pas de nombre de cristaux maximum : c'est la durée de vie des
  // cristaux qui détermine le nombre qui peuvent subsister en même temps, sachant qu'elle est comptée à partir du moment
  // où le triangle est fermé » : `max` absent, rien ne saute ; un triangle s'éteint `duree` après la pose de sa
  // troisième balise, et un triangle encore ouvert ne s'éteint pas — voir `finDuTrio`)
  balise?: { tous: number; ecart: number; max?: number; duree: number; garde: number; periode: number; irradie?: { dps: number }; devant?: number }
  /**
   * UNE TRAÎNÉE DE GIVRE (le Frimas, Keko, 15/11 : « une attaque qui laisse une traînée de givre derrière le vaisseau,
   * qui ralentit et inflige des dégâts aux ennemis tant qu'ils restent dedans ») : en vol, il sème DERRIÈRE LUI (à
   * l'opposé de sa vitesse) une plaque de givre chaque fois qu'il s'est éloigné de `ecart` de la dernière ; chacune, de
   * `rayon`, dure `duree` secondes. Un insecte dans une plaque perd `dps` par seconde et avance à `ralenti` de sa vitesse
   * (il le reste un instant après en être sorti). L'état est `Monde.givres`.
   */
  // (… ET UNE TRAÎNÉE DE POISON, celle du Ver — Keko, 17/11 : « le Ver récupère un sort qui fait une traînée de poison » :
  // `poison` — la même traînée, qui ne gèle ni ne ralentit ; un insecte dedans est empoisonné, `Ennemi.poisonA`)
  givre?: { ecart: number; rayon: number; duree: number; dps: number; ralenti: number; poison?: boolean; /** CORROSIVE (la traînée du Ver) : qui y est est rongé — voir `ronger`. */ corrosion?: { duree: number; bonus: number } }
  /**
   * UNE NOVA DE GIVRE (le Frimas, à la place de sa traînée — Keko, 17/11 : « une nova de givre qui laisse une plaque de
   * verglas, plus grosse, mais pas en permanence une traînée ») : à sa cadence, un insecte à moins de `rayon`, une onde
   * de froid part du vaisseau : tout insecte à moins de `rayon` prend `degats` (ceux de l'arme) et GÈLE (`gel`) ; elle
   * laisse sous lui UNE PLAQUE DE VERGLAS (`plaque` : une plaque de givre, `Monde.givres`, bien plus grande que celles de
   * la traînée) qui ralentit et ronge ce qui y marche.
   * (… UNE ONDE QUI S'OUVRE — Keko, 19/11 : « le cercle autour de la nova touche visuellement les ennemis, mais ils ne
   * subissent pas de dégâts » : elle frappait tout d'un coup au départ, et son front, à l'écran, s'ouvrait ensuite. Elle
   * s'ouvre maintenant en `ouverture` secondes, du cœur à `rayon`, comme à l'écran, et frappe chaque insecte UNE FOIS,
   * quand son front l'atteint — y compris celui qui y entre en chemin. L'état est `Monde.novas`.)
   */
  nova?: { rayon: number; ouverture?: number; gel: { duree: number; ralenti: number }; plaque: { rayon: number; duree: number; dps: number; ralenti: number } }
  // (D'ABORD DES MINI-VERS QUI COPIENT SES MOUVEMENTS — Keko, 17/11 : « il pose des œufs sur son passage, qui éclosent une
  // ou deux secondes plus tard, et un mini-ver de poison en sort, qui copie les mouvements du ver » ; tout insecte près de
  // lui était empoisonné)
  // (… PUIS DES ŒUFS-PIÈGES — Keko, 17/11 : « c'est extrêmement difficile de toucher les ennemis avec les vers qui copient
  // le ver principal ; en jeu, c'est un enfer » ; « que les vers sortent dès qu'un ennemi entre à proximité de l'œuf, dans sa
  // zone ; l'œuf éclot et le ver le poursuit ») : il pond toujours en bougeant, toutes les `tous` secondes, `max` à la fois ;
  // L'ŒUF ATTEND, `attente` secondes au plus, qu'un insecte entre à moins de `detection` ; alors il SE FEND et éclot
  // `eclosion` secondes plus tard ; le mini-ver POURSUIT cet insecte — puis, mort, le plus proche à `vue` —, à `vitesse`,
  // en virant de `virage` par seconde (il serpente) ; il vit `duree` secondes ; tout insecte à moins de `rayon` de lui prend
  // le venin)
  // (D'ABORD DES SALVES DE SES FLANCS — Keko, 17/11 : « il lance des épines d'os sur ses côtés, en longueur, des deux côtés,
  // à intervalles réguliers » —, puis tirées droites sans viser ; « c'est affreux de toucher avec les pics, c'est pas fun »)
  /**
   * L'ÉPINE D'OS QUI TRANSPERCE (la troisième arme du Ver — Keko, 18/11 : « un projectile assez important qui traverse tout
   * et qui embroche les ennemis ») : à sa cadence, un insecte à `portee` (le verrouillé d'abord, sinon le plus proche),
   * UNE GRANDE ÉPINE part de sa tête vers lui, à `vitesse`, `vie` secondes. ELLE TRAVERSE TOUT : chaque insecte à moins de
   * `largeur` (plus son rayon) prend `degats`, une fois, ET RESTE OÙ IL EST. L'état est `Monde.brochettes`.
   * (… SANS EMPORTER PERSONNE — Keko, 18/11 : « je ne sais pas si c'est une bonne idée de faire reculer les monstres :
   * parfois, quand je les poursuis, je les pousse dans le vortex ; que le projectile d'os traverse les ennemis sans les
   * repousser » : elle les enfilait sur sa tige et les emportait jusqu'au bout de sa course, où ils prenaient l'impact)
   */
  epines?: { largeur: number }
  // (… PUIS LA LARVE PREND LE CONTRÔLE — Keko, 17/11 : « le parasite qui sort de l'œuf prend le contrôle de l'hôte, qui
  // devient un serviteur du ver, temporairement ; il attaque les autres ennemis, sans qu'ils le prennent pour cible » ; « des
  // dégâts à la fin de l'effet, pas pendant » ; « pas de contrôle mental sur les gros insectes ») : la larve sortie de l'œuf
  // court sur sa proie ; au contact, UN PETIT DEVIENT UN SERVITEUR (`servant`) pendant `duree` secondes — `max` à la fois :
  // il QUITTE LA NUÉE (plus personne ne le vise, ni les insectes, ni nos armes), chasse l'insecte le plus proche et le mord
  // (`morsure`, toutes les `cadence` secondes) ; à la fin, il revient dans la nuée et perd `fin` points d'un coup. UN GRAND
  // (ou un petit quand il y a déjà `max` serviteurs) n'est pas contrôlé : la larve s'accroche et le ronge — le venin — et
  // le freine. (Keko, 18/11 : « je ne suis pas fan du contrôle mental ; c'est plutôt un bonus durant la partie, une chance
  // d'appliquer un contrôle mental sur les attaques » : retiré, `git log` le garde)
  /**
   * DES ŒUFS QUI ÉCLOSENT D'EUX-MÊMES (la deuxième arme du Ver — Keko, 18/11 : « quand un œuf est posé, il s'ouvre
   * automatiquement après un délai, il n'attend pas qu'un ennemi passe à côté ; à son ouverture, il libère trois mini-vers,
   * des copies du gros ver en miniature, qui poursuivent les ennemis et les mordent ») : tant qu'il bouge, il POND un œuf
   * derrière lui toutes les `tous` secondes — `max` œufs à la fois ; l'œuf ÉCLOT `eclosion` secondes après la ponte et
   * libère `nombre` MINI-VERS, partis en étoile. Chacun vit `duree` secondes : il POURSUIT un insecte à moins de `vue` de
   * lui — d'abord un que ses frères ne chassent pas —, à `vitesse`, en virant de `virage` par seconde (il serpente) ; au
   * contact, il le MORD : `morsure` points toutes les `cadence` secondes. Sans proie, il nage en ondulant. L'état est
   * `Monde.oeufs` et `Monde.miniVers`.
   */
  ponte?: { tous: number; max: number; eclosion: number; nombre: number; duree: number; vitesse: number; virage: number; vue: number; morsure: number; cadence: number }
  /**
   * UNE SALVE TOUT AUTOUR (les éclats de glace du Frimas, Keko, 15/11 : « périodiquement, des éclats de glace dans toutes
   * les directions autour de lui, portée moyenne ; huit éclats répartis uniformément ; évidemment, ils ralentissent ») :
   * à sa cadence, s'il y a un insecte à portée, il tire `nombre` obus à la fois, à angles égaux autour de lui (le
   * premier vers son nez). Avec `gel`, un obus qui touche GÈLE l'insecte `duree` secondes, à `ralenti` de sa vitesse.
   * PUIS (Keko, 15/11 : « c'est super faible, j'ai de la chance si un seul éclat touche ») : LA COURONNE S'ORIENTE — le
   * premier éclat part vers la cible (la verrouillée à portée d'abord, sinon la plus proche) — ET, `perce`, LES ÉCLATS
   * TRAVERSENT : chacun touche tout ce qu'il croise, une fois chacun, jusqu'au bout de sa course.
   * PUIS (Keko, 16/11 : « les 8 fragments, mais beaucoup plus gros ; et quand ils touchent, ils se séparent en petits
   * fragments — ceux de l'effet Ice Shatter — pour créer un petit cône derrière ») : avec `eclatement`, un éclat
   * S'ARRÊTE au premier insecte touché et s'y brise en `nombre` petits fragments, lancés DERRIÈRE LUI dans un cône de
   * `cone` radians autour de sa course, à `vitesse`, `vie` secondes ; chacun traverse ce qu'il croise (jamais l'insecte
   * brisé) : `degats` points, et le même `gel`.
   */
  salve?: { nombre: number; perce?: boolean; eclatement?: { nombre: number; cone: number; vitesse: number; vie: number; degats: number } }
  /**
   * DES ÉCHARDES DE GIVRE QUI SE CONDENSENT (le Frimas, à la place de sa salve — Keko, 19/11 : « les éclats se matérialisent
   * quelque part autour du vaisseau, comme si l'humidité de l'air se condensait pour former un éclat de givre, et foncent
   * vers une cible à portée, une portée à peu près comme le canon du chasseur ; ils gèlent la cible ; le vaisseau crée des
   * échardes autour de lui jusqu'à un certain nombre, disons 5, et dès qu'il passe à portée d'un ennemi, les 5 foncent,
   * chacune à leur tour, très rapidement, vers les ennemis aux alentours ») : une écharde se forme toutes les `cadence`
   * secondes à une place libre autour du vaisseau (`max` places sur un cercle de `rayon`, qui tourne lentement), PRÊTE
   * après `apparition` secondes ; dès qu'un insecte est à `portee`, toutes les prêtes partent, une toutes les `intervalle`
   * secondes, chacune vers un insecte à portée — le verrouillé d'abord, puis du plus proche au plus lointain, en boucle —,
   * ACCROCHÉE À LUI (elle ne le manque pas) : ses `degats`, et `gel`. Pleines, elles attendent ; partie une, la suivante
   * se forme `cadence` secondes plus tard. L'état est `Monde.echardes`.
   */
  condense?: { max: number; rayon: number; apparition: number; intervalle: number }
  /**
   * UNE TORNADE DE GIVRE (la troisième arme du Frimas, Keko, 15/11 : « une tornade de givre qui part du vaisseau et qui
   * suit automatiquement les ennemis, et disparaît au bout d'un certain temps ; elle crée une petite zone dans laquelle
   * les ennemis sont ralentis et prennent des dégâts tant qu'ils sont dedans ») : à sa cadence, un insecte à portée, une
   * tornade part du vaisseau ; elle file à `vitesse` vers l'insecte le plus proche d'ELLE (le verrouillé d'abord), en
   * virant de `virage` par seconde ; elle vit `duree` secondes. Tout insecte à moins de `rayon` d'elle perd `dps` par
   * seconde et avance à `ralenti` de sa vitesse. L'état est `Monde.tornades`.
   */
  tornade?: { vitesse: number; virage: number; duree: number; rayon: number; dps: number; ralenti: number }
  gel?: { duree: number; ralenti: number }
  /**
   * UNE ORBE DE PLASMA (le Pulsar, Keko, 16/11 : « un style de jeu basé sur le plasma et l'énergie ; des explosions de
   * plasma violet-bleu ») : un obus lent, tiré droit vers LÀ OÙ SERA la cible, qui vole juste le temps d'y arriver ; en
   * chemin il TRAVERSE tout ce qu'il croise (`degats`, une fois chacun), et au bout de sa course il ÉCLATE : tout insecte
   * à moins de `rayon` perd `plasma.degats`.
   */
  plasma?: { rayon: number; degats: number }
  /**
   * UN ESSAIM DE MISSILES À TÊTE CHERCHEUSE (la deuxième arme du Pulsar, Keko, 16/11 : « dans le style des missiles
   * magiques — l'Arcane missiles de pixelfx —, en mode plasma : plein de petits missiles à tête chercheuse tirés en même
   * temps, comme une salve, qui foncent sur les ennemis aux alentours ») : à sa cadence, un insecte à portée, `nombre`
   * missiles partent ensemble de la bouche, EN ÉVENTAIL (de −`eventail` à +`eventail` autour de la première cible), puis
   * se recourbent et foncent de plus en plus vite : leur vitesse monte de `vitesse` de `acces` × âge², jusqu'à
   * `pointe` ; leur braquage se resserre avec l'âge (`braquage`). LES CIBLES SE PARTAGENT : les insectes à portée, du
   * plus proche au plus loin (le verrouillé d'abord), un missile chacun à tour de rôle ; une cible morte, le missile
   * prend l'insecte le plus proche de lui. Chacun fait `degats` à ce qu'il touche.
   */
  // PUIS DES MISSILES MAGIQUES, CHAOTIQUES (Keko, 16/11 : « ils ont trop une trajectoire de missiles ordinaires ; les
  // missiles magiques font des zigzags dans tous les sens et finissent par arriver sur leur cible ; chaque missile prend
  // une cible aléatoire parmi celles à portée — sauf si une cible est verrouillée : tous vont sur elle ») : chacun part
  // dans une direction tirée au hasard (à ±`eventail` de sa cible) ; il vole PAR BONDS de `pas` secondes (un peu plus ou
  // un peu moins pour chacun), et à chaque bond il change brusquement de cap — vers sa cible, plus un écart tiré au
  // hasard, d'un bord à l'autre, jusqu'à ±`chaos` ; l'écart S'ÉTEINT en `calme` secondes : il finit droit sur elle. Il
  // braque fort (`braquage`, par seconde) : les changements de cap sont des cassures, pas des courbes. Sa vitesse monte
  // de `vitesse` de `acces` × âge², jusqu'à `pointe`. LA CIBLE : tirée au hasard parmi les insectes à portée, missile par
  // missile — le verrouillé, s'il est à portée, pour tous ; une cible morte, le missile prend l'insecte le plus proche de
  // lui.
  /**
   * UNE SPHÈRE DE PLASMA QUI TIRE EN PASSANT (la première arme du Pulsar refaite, Keko, 16/11 : « on tire en ligne droite
   * la sphère directement — celle qu'on dessine lors de l'explosion, pas le petit projectile d'avant — et elle tire des
   * petits projectiles arcaniques sur tous les ennemis proches sur sa trajectoire ») : à sa cadence, un insecte à portée
   * (le verrouillé d'abord, sinon le plus proche), une sphère part de la bouche vers lui, TOUT DROIT, à `vitesse` ; elle
   * vit `duree` secondes. Toutes les `periode` secondes, elle tire UN PETIT PROJECTILE sur CHAQUE insecte à moins de
   * `rayon` d'elle : un trait arcanique, à tête chercheuse, un peu zigzagant (les missiles de l'essaim, en petit), qui
   * part à `vitesseTir` et fait `degats` (ceux de l'arme). Elle-même ne touche rien. L'état est `Monde.spheres`.
   */
  // (`foudre` : LA BOBINE TESLA de l'Empire — Keko, 22/11 : « l'arc tesla, c'est une chaîne d'éclair bis » : au lieu de
  // petits traits, elle FOUDROIE à l'instant les `cibles` insectes les plus proches dans son rayon, à chaque période)
  // (`foudre.rebonds` : CONDUCTION — Keko, 24/11 : « l'arc rebondit sur 2 autres cibles, en mode chaîne d'éclair » : chaque
  // éclair saute ensuite `n` fois d'ennemi en ennemi, à `saut` au plus, perdant `attenuation` à chaque bond, jamais deux fois
  // sur le même dans sa chaîne)
  // (`magnetisme` : MAGNÉTISME — Keko, 24/11 : « attire les ennemis ET les pépites » — les cristaux : les insectes à `rayon` de
  // la boule glissent vers elle à `vitesse`, sans s'y coller ; les cristaux à `rayon` d'elle volent vers elle à `cristaux`
  // et comptent dès qu'ils l'atteignent ; ni les plaques, ni les soins, ni l'aimant)
  // (… PAR SON ANNEAU — Keko, 24/11 : « quand le cercle extérieur se contracte, c'est quand il touche qu'il ramasse les
  // pépites, et qu'il donne aux ennemis une petite impulsion vers l'intérieur » : toutes les `periode` secondes, un anneau
  // part de `rayon` et se referme sur la boule (`anneauMagnetique`) ; un cristal qu'il touche est emporté avec lui et compte
  // au centre ; un insecte qu'il touche fait un bond de `impulsion` vers elle)
  // (`trainee` : HAUTE TENSION — Keko, 24/11 : « la bobine laisse dans son sillage une traînée électrique » : un sillon (voir
  // `Arme.sillon`) dont chaque bout dure `duree` ; ce qui y passe perd `dps` par seconde et est électrocuté si la bobine
  // l'est — sans faire sauter d'arc : c'est continu)
  // (`accumulateur` : ACCUMULATEUR — Keko, 24/11 : « les coups critiques de la bobine augmentent ses dégâts de X % pour toute
  // sa durée restante » : chaque critique d'une boule lui ajoute cette part de dégâts, jusqu'à sa fin — +20 %, cumulable)
  sphere?: { vitesse: number; duree: number; rayon: number; periode: number; vitesseTir: number; foudre?: { cibles: number; rebonds?: { n: number; saut: number; attenuation: number } }; accumulateur?: number; magnetisme?: { rayon: number; periode: number; impulsion: number }; trainee?: { duree: number; dps: number; largeur: number } }
  /**
   * UN PUITS DE PLASMA (la troisième arme du Pulsar, Keko, 16/11 : « on va tenter le puits » — une petite singularité lancée
   * au milieu de la nuée, qui aspire les insectes vers son centre puis éclate) : à la cadence, un insecte à portée, il part
   * de la bouche vers L'INSECTE QUI A LE PLUS DE VOISINS à moins de `rayon` (le verrouillé d'abord), à `vitesse`, et
   * s'ouvre au point visé (pris au départ) ; ouvert `duree` secondes, il TIRE VERS SON CENTRE tout insecte à moins de
   * `rayon`, à `force` par seconde ; puis il ÉCLATE : `degats` (ceux de l'arme) à tout ce qui est à moins de `eclat`.
   * L'état est `Monde.puits`.
   */
  puits?: { vitesse: number; rayon: number; force: number; duree: number; eclat: number }
  /**
   * UNE MÉTÉORE D'ARCANE (la troisième arme du Pulsar, Keko, 16/11 : « une petite météore d'arcane vient du ciel et tombe
   * sur un ennemi ; ce serait la seule attaque qui frappe directement l'ennemi sans projectile ») : à la cadence, un
   * insecte à portée (le verrouillé d'abord, sinon le plus proche), une météore tombe du ciel sur lui en `chute` secondes
   * — son point de chute SUIT l'insecte (elle ne le manque pas ; mort avant, elle tombe où il était, sur rien) ; à
   * l'impact, `degats` (ceux de l'arme) À LUI SEUL (Keko, 16/11 : « annuler la zone d'effet, on frappe juste la cible »).
   * Rien ne vole dans le plan du jeu : l'état (`Monde.meteores`) ne dit que le point visé et l'heure de l'impact.
   */
  meteore?: { chute: number }
  /**
   * UN RAILGUN (passé du Pulsar au Prisme le 16/11, en bleu ; d'abord la troisième arme du Pulsar, Keko, 16/11 : « un tir de plasma instantané type railgun, sur une
   * très grande distance, longue portée, qui traverse tout ») : à sa cadence, un insecte à `portee`, UN TRAIT INSTANTANÉ
   * part de la bouche, long de `portee` : tout insecte à moins de `largeur` (plus son rayon) de la ligne perd `degats`. Sa
   * direction : vers le verrouillé, s'il est à portée ; sinon, des lignes qui passent par chaque insecte à portée, celle
   * qui en traverse LE PLUS (à égalité, vers le plus proche).
   */
  rail?: { largeur: number }
  /**
   * DES TENTACULES À AIGUILLE (la première arme du Kraken, Keko, 16/11 : « un vaisseau organique — les vaisseaux zergs, le
   * Léviathan ; des tentacules avec des aiguilles au bout qui s'étendent vers les ennemis et qui les piquent ; pas en
   * ligne droite : la tentacule fait un petit virage, un truc bien organique ») : `ancres.length` tentacules, chacune
   * fixée au vaisseau à son ancre (en unités du vaisseau, le nez vers +x ; posées par le rendu, qui dessine leurs
   * racines). Une tentacule au repos prend un insecte à `portee` de son ancre — le verrouillé d'abord ; sinon le plus
   * proche qu'aucune autre ne vise, ou le plus proche tout court — et S'ÉTEND vers lui en `aller` secondes, en suivant
   * une courbe (son `virage`, d'un côté ou de l'autre, tiré au hasard : le dessin la courbe d'autant) ; tendue, elle
   * PIQUE (`degats`), reste plantée `tenue` secondes, puis SE RÉTRACTE en `retour` ; elle repart `cadence` secondes
   * après. Sa cible morte ou trop loin avant la piqûre, elle se rétracte. L'état est `Monde.tentacules`.
   */
  tentacule?: {
    ancres: [number, number][]
    aller: number
    tenue: number
    retour: number
    virage: number
    /**
     * TOUR À TOUR (Keko, 19/11 : « il a déjà des tentacules naturellement ; qu'il utilise ses tentacules arrière et les
     * projette vers l'avant, un peu comme les rejetons ») : les ancres sont les racines de ses tentacules, et une seule
     * part à la fois, toutes les `cadence` secondes — celle au repos dont la racine est la plus proche de la cible, prise
     * à `portee` du VAISSEAU (le verrouillé d'abord, puis le plus proche que les autres ne visent pas). Sans lui, chaque
     * tentacule choisit seule, depuis son ancre, et repart `cadence` après son retour.
     */
    alterne?: boolean
  }
  /**
   * UN ESSAIM D'INSECTES EN NUAGE (la deuxième arme du Kraken, Keko, 16/11 : « un essaim d'insectes, tout petits mais en
   * nuage, qui flotte autour du vaisseau ») : un nuage de `rayon` qui SUIT le vaisseau sur un ressort (`raideur`,
   * `frein`) — il traîne derrière lui quand il file, le rattrape quand il s'arrête — et qui SE PENCHE vers l'insecte le
   * plus proche à `portee` du vaisseau (le verrouillé d'abord), sans s'éloigner du vaisseau de plus de `laisse`. Tout
   * insecte dans le nuage perd `dps` par seconde (une morsure se signale toutes les `periode` secondes). À la différence
   * de l'aura de la Sentinelle, il n'est pas collé au vaisseau : on le promène, on le traîne sur la nuée. L'état est
   * `Monde.nuees`.
   */
  // PUIS UN NUAGE QUI RESTE AUTOUR DU VAISSEAU ET S'ÉTIRE (Keko, 16/11 : « que l'essaim reste bien autour du vaisseau
  // quand pas d'ennemis à portée ; et quand des ennemis sont à portée, l'essaim se déforme et s'étend vers les ennemis ») :
  // le nuage, de `rayon`, est CENTRÉ SUR LE VAISSEAU (plus de ressort ni de traîne) ; vers les `bras` insectes à `portee`
  // les plus proches (le verrouillé d'abord), il ÉTEND UN BRAS, qui s'allonge en `deploiement` secondes et se rétracte de
  // même quand son insecte meurt ou s'éloigne. Un insecte au bout d'un bras tendu, ou dans le nuage, perd `dps` par
  // seconde (une morsure se signale toutes les `periode` secondes).
  // (… RENOMMÉ « LA NUÉE », ET SES DÉGÂTS SONT UN BUDGET — Keko, 17/11 : « l'essaim, c'est déjà le nom de la race » ; « la
  // nuée a un budget de X dégâts par seconde : si un seul ennemi est attaqué, il prend la totalité ; si deux, c'est divisé
  // par deux » : les insectes mordus en même temps — au bout d'un bras tendu, ou dans le nuage — se partagent `budget`
  // points par seconde, à parts égales)
  // (… ET SANS LIMITE D'INSECTES — Keko, 20/11 : « on va carrément enlever le système de bras : la nuée attaque autant
  // d'ennemis à portée, en divisant ses dégâts entre ceux-ci, sans limite d'ennemis » : plus de `bras` au plus ; elle
  // s'étend vers TOUS les insectes à `portee`, et tous ceux qu'elle mord se partagent `budget`)
  // (… ET UNE SEULE PORTÉE — Keko, 20/11 : « fusionner la zone et la portée de la nuée ; on va juste dire portée, et dès
  // qu'un ennemi est à portée, la nuée l'attaque ; pas besoin d'une zone où elle attaque et d'une zone où elle poursuit » :
  // tout insecte à `portee` est mordu TOUT DE SUITE ; les jets qui s'étendent vers lui ne sont plus qu'à l'image, et
  // `rayon` n'est plus que la taille du nuage dessiné autour du vaisseau)
  // (… ET ELLE SE NOURRIT — Keko, 20/11 : « la nuée est clairement en dessous : on prend beaucoup de risques, le vaisseau
  // est peu maniable, lent, proche des ennemis ; à chaque fois que la nuée inflige des dégâts, ses dégâts partagés et le
  // nombre de ses particules augmentent, et plus on passe de temps sans infliger de dégâts, plus ça diminue, avec un
  // maximum ; à chaque tic de dégâts, de 1 % par exemple » : `festin` — à chaque morsure signalée (toutes les `periode`
  // secondes), CHAQUE INSECTE MORDU ajoute `pas` à sa croissance, jusqu'à `max` ; une morsure sans personne à mordre en
  // retire `perte`. (… PUIS ELLE FOND VITE — Keko, 20/11 : « la taille de l'essaim doit diminuer beaucoup plus vite qu'elle
  // ne grossit : dans ce type de jeu, on est quasiment tout le temps en train d'infliger des dégâts, on doit vraiment punir
  // un joueur qui ne frappe plus avec la nuée ; en 3 secondes, l'essaim doit avoir rétréci » : plus de `perte` par
  // morsure ; sans personne à portée, elle perd tout son maximum en `fonte` secondes, en continu — 3, puis 5 : « l'essaim
  // diminue trop vite ; il peut passer de sa taille 100 % à sa taille minimale en 5 secondes » ; puis 10 : « elle réduit encore trop vite, en une
  // seconde ou deux sa taille a réduit énormément » — la fonte est linéaire, une nuée à moitié pleine fondait en 2,5 s.) Ses dégâts sont `budget` × (1 + croissance) ; la page en multiplie ses moucherons. *Les chiffres sont
  // de moi.*)
  nuee?: { rayon: number; budget: number; deploiement: number; periode: number; festin?: { pas: number; max: number; /** En combien de secondes sans rien à mordre elle perd tout (voir plus haut). */ fonte: number; /** Sa croissance au départ (0 ; `&festin=P` l'essaie). */ depart?: number } }
  /**
   * DES REJETONS (la troisième arme du Kraken, Keko, 16/11 : « on spawn un mini vaisseau qui est autonome et attaque les
   * ennemis, un genre de truc avec des tentacules qui flottent derrière lui et s'en sert pour attaquer ») : à sa cadence,
   * un insecte à `portee` du vaisseau, il POND un rejeton derrière lui — `max` à la fois, chacun vit `duree` secondes.
   * Un rejeton NAGE PAR À-COUPS (sa vitesse bat, comme une méduse), jusqu'à `vitesse`, en tournant de `acces` par
   * seconde vers ce qu'il veut : l'insecte le plus proche DE LUI à `vue` (le verrouillé d'abord) ; sans proie, la place
   * derrière le vaisseau. À `allonge` de sa proie, il la FOUETTE d'une tentacule : `degats`, toutes les `periode`
   * secondes. L'état est `Monde.rejetons`.
   */
  rejeton?: { max: number; duree: number; vitesse: number; acces: number; vue: number; allonge: number; periode: number }
  /**
   * UN CRACHAT D'ACIDE (la première arme de la Vouivre, Keko, 16/11 : « un vaisseau alien organique spécialisé dans la
   * corrosion et le toxique ; un crachat : un cône d'acide craché devant, qui laisse une trace — une flaque conique ; le
   * crachat et la flaque infligent le statut ACIDE, qui inflige des dégâts faibles mais augmente les dégâts subis de
   * toutes les sources ») : à sa cadence, un insecte à `portee` (le verrouillé d'abord, sinon le plus proche), il crache
   * de la bouche vers lui un CÔNE de demi-angle `cone`, long de `portee` : tout insecte dedans perd `degats` et est
   * RONGÉ. Le cône laisse au sol UNE FLAQUE de même forme, qui vit `duree` secondes : tout insecte dedans est rongé.
   * L'ACIDE (`Ennemi.acide`) dure `acide.duree` secondes après le dernier contact : l'insecte perd `acide.dps` par seconde,
   * et TOUT CE QU'IL PERD D'AUTRE, DE TOUTES LES SOURCES, est majoré de `acide.bonus` (une part : 0,35 = 35 % de plus).
   * L'état est `Monde.flaquesAcides`.
   */
  crachat?: { cone: number; duree: number; acide: { duree: number; dps: number; bonus: number } }
  /**
   * DES MINES D'ACIDE (la deuxième arme de la Vouivre, Keko, 16/11 : « des mines : elle lance en cloche depuis son dos des
   * bulles, des pustules d'acide, qui explosent à courte distance des ennemis : une explosion de gaz qui fait des dégâts
   * et infecte — la corrosion ») : à sa cadence, elle LANCE EN CLOCHE une pustule depuis son dos (… PUIS AU SOL, SANS
   * CIBLE, EN PERMANENCE : autour d'elle, entre `portee` × 0,45 et `portee`, voir `menerLesMines`) ; la pustule vole `vol` secondes, se pose et ATTEND, `duree` secondes au plus — `max` à la fois
   * (la plus vieille saute). Posée, dès qu'un insecte entre dans sa zone — à moins de `rayon` —, elle ÉCLATE EN GAZ : tout
   * insecte à moins de `rayon` perd `degats` et est RONGÉ (`acide`, comme le crachat). L'état est `Monde.mines`.
   */
  // (… ET ELLE ÉCLATE DÈS QU'UN INSECTE ENTRE DANS SA ZONE D'EFFET — Keko, 16/11 : le déclenchement, c'est le `rayon`)
  // (… PUIS ELLES EMPOISONNENT — Keko, 19/11 : « les mines de la Vouivre doivent appliquer l'état empoisonné » : plus
  // l'acide du crachat, `poison` — voir `Ennemi.poison`)
  mine?: { max: number; duree: number; vol: number; rayon: number; poison?: { duree: number; dps: number }; /** Son gaz RONGE (Keko, 21/11 : l'effet corrosif, la vulnérabilité, à la place des dégâts du poison). */ corrosion?: { duree: number; bonus: number } }
  /**
   * UN FLÉAU D'ARMES (la troisième arme de l'Ingénieur, à la place des balises — gardées pour un futur vaisseau ; Keko,
   * 16/11 : « une chaîne reliée au vaisseau qui tourne autour de lui, et au bout de la chaîne une grosse massue avec des
   * pics, en mode fléau d'armes ; le fléau fait le tour du vaisseau et blesse les ennemis sur sa route ») : une MASSE au
   * bout d'une chaîne de `longueur`, qui TOURNE autour du vaisseau à `vitesse` (rad/s). Elle a son INERTIE : poussée
   * tangentiellement vers sa vitesse de rotation, la chaîne la tient à sa longueur — quand le vaisseau file, elle traîne
   * derrière, puis reprend son tour. Tout insecte à moins de `rayon` d'elle prend `degats`, une fois toutes les `rebond`
   * secondes au plus. L'état est `Monde.fleaux`.
   */
  // (… PUIS UNE PRISE PLUS LARGE QUE LA BOULE, ET UNE CHAÎNE QUI FRAPPE AUSSI — Keko, 16/11 : « que la boule ait une hitbox un
  // peu plus grosse, et que la chaîne fasse aussi des dégâts, moins forts que la boule ») : la masse touche à `prise` (sa
  // taille dessinée reste `rayon`) ; un insecte à moins de `chaine.epaisseur` de la chaîne prend `chaine.degats`, une
  // fois toutes les `rebond` secondes au plus — jamais au même pas qu'un coup de masse)
  fleau?: { longueur: number; vitesse: number; rayon: number; prise: number; rebond: number; chaine: { degats: number; epaisseur: number } }
  /**
   * DES PARASITES (la troisième arme de la Vouivre, Keko, 16/11 : « ok pour le parasite, mais il ne saute que sur une
   * seule autre cible à sa mort ») : à sa cadence, un insecte à `portee` qui n'en porte pas (le verrouillé d'abord, sinon
   * le plus proche), elle crache une LARVE vers lui — `max` à la fois. La larve vole à `vitesse`, à tête chercheuse ; au
   * contact elle S'ACCROCHE et ronge son hôte : `dps` par seconde, et l'ACIDE (`acide`, tenu tant qu'elle y est). À LA MORT
   * DE SON HÔTE, elle SAUTE sur UN seul autre insecte — le plus proche à moins de `saut` qui n'en porte pas — ; s'il n'y en
   * a pas, ou qu'elle ne l'atteint pas en `vie` secondes, elle meurt. L'état est `Monde.parasites`.
   * (… SANS POISON — Keko, 18/11 : « je ne voudrais pas que ce soit des parasites de poison ; plutôt de petits cerveaux
   * avec des dents qui s'accrochent, un peu comme les métroïdes » : l'acide est facultatif, celui du Ver n'en a plus — il
   * ne fait que dévorer, `dps`)
   */
  parasite?: { max: number; dps: number; saut: number; vie: number; acide?: { duree: number; dps: number; bonus: number } }
  /**
   * LE DRAIN D'ÂME (le Néant, Keko, 17/11 : « l'effet Soul Drain de pixelfx : ça touchera tous les ennemis à portée et ça
   * drainera la vie vers le vaisseau ; cette attaque aura la particularité de recharger plus vite la corruption que les
   * autres attaques ») : tout insecte à moins de `rayon` du vaisseau perd `dps` par seconde, sans cesse (comme l'aura) ;
   * et LA VIE DRAINÉE PURGE LA CORRUPTION : chaque point pris en purge `purge` — en continu, quand un insecte abattu par
   * une autre arme n'en purge que `corruption.purge`, une fois.
   * (… DEUX INSECTES À LA FOIS AU PLUS — Keko, 17/11 : « on va limiter le drain d'âme à deux ennemis simultanément ; avec
   * les améliorations durant une run, on pourra augmenter ce nombre » : `cibles` — le verrouillé d'abord, puis les plus
   * proches)
   * (… ET IL ACCROCHE — Keko, 17/11 : « le drain accroche les cibles et continue d'être actif quand on s'éloigne ; la
   * portée ne sert qu'à accrocher la cible, et peu importe la distance, le drain continue » : un insecte à moins de `rayon`
   * est ACCROCHÉ — `cibles` liens à la fois — et le lien tient, à toute distance, jusqu'à sa mort ; alors la place se
   * libère pour le prochain qui passe à portée. L'état est `Monde.liens` ; voir `liesAuDrain`)
   */
  // (… PUIS SANS LIMITE — Keko, 17/11 : « enlever la limite à deux ennemis ; autant d'ennemis que possible, du moment qu'ils
  // ont été dans la zone, ils sont pris dans le drain » : `cibles` absent, tout ce qui passe à portée est accroché)
  drain?: { rayon: number; dps: number; cibles?: number }
  /**
   * LES VRILLES D'OMBRE (le Néant, Keko, 17/11 : « l'effet Shadow Tendrils de pixelfx : on crée une tentacule dans un
   * endroit aléatoire autour du vaisseau, et ce tentacule attaque les ennemis proches ») : à sa cadence, un insecte à
   * `portee` du vaisseau, UNE VRILLE sort d'une flaque d'ombre en un point tiré au hasard autour de lui, entre `pres` et
   * `loin` — `max` à la fois (la plus vieille rentre) ; elle vit `duree` secondes, IMMOBILE (le vaisseau peut la quitter).
   * PUIS ELLE SAISIT AU LIEU DE FOUETTER (Keko, 17/11 : « ça ressemble trop aux tourelles de l'ingénieur ; la tentacule
   * saisit un ennemi et s'enroule autour de lui ; les petits ennemis sont immobilisés sur place et subissent des dégâts
   * par seconde ; un ennemi trop grand, un mini-boss ou un boss, elle le saisit mais ne l'immobilise plus ; et s'il
   * s'éloigne hors de sa portée, il subit des dégâts au moment où il la quitte ») : sortie (`sortie` secondes), libre,
   * elle SAISIT l'insecte le plus proche d'elle à moins de `allonge` qu'aucune autre ne tient (le verrouillé d'abord) ;
   * elle le serre : `dps` par seconde (signalé toutes les `periode` secondes) ; UN PETIT est IMMOBILISÉ (`Ennemi.tenuA`),
   * UN GRAND (`Ennemi.grand`) avance encore — s'il sort de `allonge`, il S'ARRACHE : `arrache` points d'un coup, et elle le
   * lâche. Sa proie morte ou partie, elle en saisit une autre. L'état est `Monde.vrilles`.
   */
  vrille?: { max: number; duree: number; pres: number; loin: number; allonge: number; sortie: number; dps: number; periode: number; arrache: number }
  /**
   * L'HYPERCUBE (la première arme du Tesseract, Keko, 18/11 : « il lance un cube en quatre dimensions, un peu comme sa
   * propre structure, en cloche, qui rebondit trois fois ; à chaque fois qu'il rebondit, il inflige une petite zone de
   * dégâts ») : à sa cadence, sur un insecte à `portee` (le verrouillé d'abord, sinon le plus proche), il LANCE EN CLOCHE
   * un hypercube là où l'insecte sera à sa chute (`vol` secondes plus tard). Il touche le sol `rebonds` fois : à chaque
   * contact, tout insecte à moins de `rayon` perd `degats` ; puis il REBONDIT plus loin, dans le sens de son lancer, de
   * `bond` — chaque bond `amorti` fois plus court, et plus bref, que le précédent. Au dernier contact, il s'éteint. L'état
   * est `Monde.hypercubes`.
   * (… IL PORTE JUSQU'À SON DERNIER REBOND — Keko, 18/11 : « qu'il lance son cube en calculant la portée non pas du
   * premier rebond mais du dernier : si un ennemi est loin, il le lance quand même, quitte à ce qu'il rebondisse avant
   * l'ennemi » : il vise un insecte jusqu'à `portee` PLUS la longueur de tous ses bonds (`allongeDeLHypercube`) ; au-delà
   * de `portee`, son premier contact tombe en deçà, pour que LE PREMIER CONTACT QUI PEUT L'ATTEINDRE tombe sur lui.
   * … ET IL GROSSIT À CHAQUE REBOND — « on ajoute une dimension de taille : plus il rebondit, plus il grossit » : sa zone
   * est `croissance` fois plus large à chaque contact — `rayon` au premier, puis `rayon` × `croissance`, etc.)
   * (… PUIS TOUS SES BONDS ÉGAUX — Keko, 18/11 : « ne varie pas la portée du premier lancer ; chaque lancer et chaque
   * rebond font la même taille : la même distance X entre le vaisseau et le premier rebond, puis entre le premier et le
   * deuxième ; il tire dès qu'un ennemi est à portée du troisième rebond » : le lancer et chaque rebond font `bond` de
   * long et durent `vol` ; il tire sur un insecte à moins de `bond` × `rebonds`, vers là où il sera au contact qui
   * tombe le plus près de lui)
   * (… ET IL TOMBE SUR UN INSECTE PLUS PRÈS — Keko, 18/11 : « si l'ennemi est au-delà de la distance du premier lancer, on
   * lance à la distance max ; s'il est plus près, on lui lance dessus » : le lancer raccourcit jusqu'à lui, les rebonds
   * gardent leur longueur ; un insecte collé au vaisseau passait sous la cloche)
   * (… ET IL NE MANQUE PLUS SA CIBLE — Keko, 18/11 : « parfois je manque la cible alors qu'elle est à portée du premier
   * rebond ; qu'un ennemi à portée du premier rebond soit touché systématiquement ; hors de portée du premier, on ajuste
   * le tir pour que le deuxième le touche ; hors de portée du deuxième, pour que le troisième le touche » : un insecte
   * entre deux contacts — à 70, entre 50 et 100 — tombait dans le trou entre leurs zones. Le contact visé est le premier
   * qui peut l'atteindre (`vise`), et le LANCER RACCOURCIT pour que ce contact tombe sur lui (les rebonds gardent leur
   * longueur) ; puis LE CUBE LE SUIT : à chaque rebond avant le contact visé, il se réoriente vers là où l'insecte sera
   * à ce contact, et pendant le bond qui doit le toucher, son point de chute suit l'insecte, d'un quart de bond au plus
   * au-delà de sa longueur)
   * (… PUIS SA TRAJECTOIRE RESTE DROITE — Keko, 18/11 : « j'aurais voulu que la trajectoire reste droite, que le cube ne
   * change pas de trajectoire ; on garde ça pour des améliorations en run » : le suivi n'est plus que derrière `suit`,
   * éteint ; le lancer réglé sur le contact visé, lui, reste)
   */
  hypercube?: { rebonds: number; rayon: number; vol: number; bond: number; croissance: number; /** LE CUBE SUIT SA CIBLE (pour une amélioration en run) : réorienté à chaque rebond, son point de chute qui la suit. */ suit?: boolean }
  /**
   * LE DÉ DU DESTIN (la deuxième arme du Tesseract, Keko, 18/11 : « un cube en 4D, un peu comme le vaisseau, au-dessus du
   * champ de bataille, et on lui attribue un chiffre aléatoire, comme un D6 : on lance un dé de 1 à 6 qui tourne avec une
   * petite animation, et ensuite il s'abat sous la forme d'un dé en 4D sur un ennemi ; un peu le sort de la comète, sauf
   * qu'il s'abat dans une zone d'effet : tous les ennemis dans la zone subissent des dégâts plus ou moins importants en
   * fonction du chiffre tiré ») : à la cadence, un insecte à `portee` (le verrouillé d'abord, sinon le plus proche), un
   * dé paraît au-dessus de lui ; son chiffre, de 1 à 6, est TIRÉ AU LANCER (seedé) ; il ROULE `roule` secondes en l'air,
   * puis S'ABAT en `chute` secondes. Jusqu'à l'impact il reste au-dessus de son insecte et le suit, comme la météore (mort
   * avant, il tombe où il était) ; à l'impact, TOUT INSECTE À MOINS DE `rayon` perd `degats` × LE CHIFFRE. L'état est
   * `Monde.des`.
   * (… ET SA ZONE SUIT LE CHIFFRE — Keko, 18/11 : « on peut corréler le chiffre du dé avec la grandeur de la zone ; la
   * zone actuelle correspondrait à un chiffre de 4 ; plus petite, c'est un chiffre plus petit, plus grosse, un chiffre
   * plus gros » : `rayon` est la zone d'un 4, chaque point de plus ou de moins l'élargit ou la resserre de `pas` —
   * `zoneDuDe`)
   */
  /**
   * UN TIR QUI NE MANQUE PAS (le canon laser du Chasseur, Keko, 18/11 : « un tir de laser à la Star Wars, vert, très
   * rapide, qui touche systématiquement une cible : il ne faut pas qu'on loupe la cible ») : l'obus part ACCROCHÉ à
   * l'insecte qu'il vise (`Obus.verrou`) et, à chaque pas, file droit vers là où il est ; plus près qu'un pas, il le touche.
   * Sa cible morte avant, il continue tout droit.
   */
  infaillible?: boolean
  /**
   * LES CARTES SPÉCIALES (Keko, 22/11 : « tous les 5 niveaux, des cartes spéciales qui modifient fondamentalement l'arme en
   * cours, voire lui ajoutent des effets ou des tirs ; dans les survivors, on accumule plusieurs armes » — voir
   * `MUTATIONS` dans `talents.ts`) : `ajoutee`, une arme AJOUTÉE par l'une d'elles (elle ne tire pas à tour de rôle avec
   * les ailes) ; `tousSens`, elle tire tout autour (pas seulement devant le nez) ; `gerbe`, chaque tir part en
   * `nombre` obus écartés de `ecart` radians ; `perforant`, ses obus traversent ; `ricochet`, ils rebondissent sur
   * `rebonds` autres ennemis à `portee`, à `part` de leurs dégâts ; `incendiaire`, ce qu'ils touchent brûle `duree`
   * secondes à `dps` ; `fragments`, son explosion projette des éclats tout autour.
   */
  ajoutee?: boolean
  tousSens?: boolean
  gerbe?: { nombre: number; ecart: number }
  /**
   * DEUX TIRS DE CÔTÉ (la carte « Triple rail » du railgun — Keko, 24/11 : « deux autres traits plus petits sont tirés en
   * plus du principal, ils partent du même endroit mais avec un angle différent ») : à ± `angle` (en radians) du tir,
   * `part` de ses dégâts, une balle `calibre` fois la sienne.
   */
  cotes?: { angle: number; part: number; calibre: number }
  /**
   * EN RAFALE (la carte « Rafale » du canon laser, Keko, 23/11 : « à la place de tirer un seul gros laser, l'avion va tirer
   * des rafales de trois lasers ; il faut que le total des trois fasse plus de dégâts que le laser seul ») : `nombre` tirs
   * à la suite, à `intervalle` secondes l'un de l'autre, chacun visant sa cible à nouveau ; puis la cadence de l'arme. Les
   * ailes alternent à la fin d'une rafale, pas entre ses tirs (`Monde.rafales` : où en est la rafale de chaque arme).
   * (… PUIS ENTRE LES AILES — Keko, 23/11 : « des rafales de 4 tirs en alternant aile gauche, aile droite, chacune des ailes
   * tire 2 fois ; exactement le même fonctionnement que le laser normal, sauf qu'on tire 4 coups plus rapides, et chaque
   * coup peut avoir une cible différente » : une arme qui tire À TOUR DE RÔLE AVEC LES AUTRES AILES partage sa rafale avec
   * elles — `Monde.rafaleDesAiles` — : après chaque tir, l'autre aile tire `intervalle` plus tard ; au bout de `nombre`,
   * toutes attendent la cadence de l'arme. Chaque tir choisit sa cible, comme un tir ordinaire. Essayé avant : trois tirs
   * sur la même cible, qui partaient même la cible morte.)
   */
  rafale?: { nombre: number; intervalle: number }
  /**
   * UN LASER CONCENTRÉ (la carte « Concentration » du canon laser, à la place de la rafale — Keko, 23/11 : « plutôt
   * qu'un seul tir de laser, un laser un peu comme celui du Prisme, mais qui dure un temps limité : on concentre un rayon
   * pendant un court instant sur la cible, et le temps total de concentration inflige plus de dégâts qu'un seul tir ») :
   * au lieu d'un obus, chaque tir accroche UN RAYON de la bouche de l'arme à sa cible, pendant `duree` secondes ; il la
   * ronge de `degats` EN TOUT, répartis sur sa durée ; il s'éteint plus tôt si elle meurt ou passe à plus d'une fois et
   * demie la portée. L'état est `Monde.faisceaux`.
   * (… QUI RICOCHE — Keko, 23/11 : « les deux améliorations ensemble, le laser sur la durée et le ricochet » : sans obus,
   * le ricochet ne faisait rien ; avec `ricochet`, LE RAYON REBONDIT de sa cible vers l'insecte le plus proche à `portee`
   * — pas celui qu'il quitte, comme le ricochet d'un tir —, à `part` de ce qu'il ronge, puis de celui-là au suivant, `rebonds`
   * fois ; refait à chaque image, la chaîne suit la mêlée.)
   */
  concentre?: { duree: number }
  /**
   * LES DEUX AILES À LA FOIS (la carte « Double laser » — d'abord « Tir double » — du canon laser, à la place de « Perforant » — Keko, 23/11 : « une
   * variation où, à chaque fois qu'on tire, les deux canons des deux ailes tirent en même temps ») : les ailes ne tirent
   * plus à tour de rôle (voir `ConfigVaisseau.alternance`) — au rythme où l'une puis l'autre tirait, TOUTES LES AILES
   * JUMELÉES TIRENT ENSEMBLE, chacune sur sa cible, avec tout ce que le tir porte. La première qui tire entraîne les autres
   * (`Monde.salveDesAiles`) ; une aile qui ne l'est pas garde son tour.
   */
  jumele?: boolean
  perforant?: boolean
  /**
   * LE RAILGUN DE L'EMPIRE (Keko, 22/11 : « un projectile très rapide qui laisse une traînée — juste visuelle — et qui
   * perd en dégâts à chaque cible traversée ; ça suffit à le distinguer » de la Désintégration du Prisme, un trait
   * instantané) : un tir qui traverse (perforant) garde part de ses dégâts après chaque insecte touché ; son corps
   * touche à calibre au-delà du bord d'un insecte (1,5 sinon), et sa course se suit d'un bout à l'autre du pas — il va
   * si vite qu'il sauterait par-dessus ; les éclats d'une variation partent de chaque insecte traversé.
   */
  balle?: { part: number; calibre: number }
  ricochet?: { rebonds: number; portee: number; part: number }
  incendiaire?: { duree: number; dps: number }
  /**
   * CORROSIF (la carte « Corrosif » du canon laser, à la place de « Cryogénique » — Keko, 23/11 : « plutôt que cryogénie, on
   * va donner un effet corrosif au laser ») : ce qu'il touche est RONGÉ `duree` secondes — tout ce qu'il perd d'autre, de
   * toutes les sources, est majoré de `bonus` (voir `Ennemi.acide`, `ronger`) ; sans dégâts sur la durée. Ses tirs, son
   * rayon concentré et ses rebonds rongent ; les cartes « Corrosion » grandissent `bonus`.
   */
  corrosif?: { duree: number; bonus: number }
  /**
   * L'ÉLECTROCUTION (Keko, 24/11 : « quand une attaque électrique — du Sentinelle principalement — touche un ennemi, on lui
   * met un état d'électrocution ; à chaque fois qu'il subit des dégâts directs — pas ceux d'un effet sur la durée —, il a un
   * pourcentage de chance de créer un petit arc électrique sur un ennemi proche, de lui infliger des dégâts et de lui
   * appliquer électrocution également ») : ce que l'arme touche est électrocuté `duree` secondes (voir `dureeDEtat`) ; à
   * chaque coup direct qu'il prend, une chance `chance` qu'un arc saute, à `saut` au plus, sur l'ennemi le plus proche :
   * `degats`, et électrocuté à son tour (voir `Ennemi.electrocute`, `propagerLElectrocution`). Les cartes « Électrocution »
   * grandissent `chance`.
   */
  electrocution?: { duree: number; chance: number; degats: number; saut: number }
  /**
   * UNE DÉTONATION SUR COUP CRITIQUE (la carte « Détonation » du canon laser — Keko, 23/11 : « dans chaque variation
   * d'armes, on va en mettre une qui se déclenche en cas de coup critique ; quand un laser fait un coup critique — ses
   * dégâts directs ou ceux d'un de ses ricochets, pas la zone de l'impulsion —, on déclenche une explosion dans la zone qui
   * inflige 200 % des dégâts du critique, et peut elle aussi être critique ») : un coup critique de l'arme fait exploser,
   * autour de l'insecte touché, une zone de `rayon` (la carte « Portée » l'agrandit) ; tout ce qui est dedans, sauf lui,
   * perd `part` fois les dégâts du critique — et chacun peut être critique à son tour. Avec la concentration, un rayon
   * critique détone à son départ, de `part` fois tout ce qu'il ronge.
   */
  detonation?: { rayon: number; part: number }
  /**
   * L'EXÉCUTION (la carte « Exécution » du railgun, sa carte sur coup critique, à la place d'« Incendiaire » — Keko, 23/11 :
   * « les coups critiques tuent instantanément les ennemis faibles ; un coup critique au railgun détruit tous les monstres
   * qui ne sont pas des mini-boss ou des boss ») : un tir critique de l'arme abat net chaque insecte qu'il touche, sauf un
   * grand (`Ennemi.grand`, mini-boss ou boss : il prend le coup) ; une roche prend le coup aussi. Le critique se tire au
   * départ du tir : une balle critique exécute toute sa ligne.
   */
  execute?: boolean
  /**
   * LE SILLON ÉLECTRIQUE (la carte « Sillon » du railgun, à la place de « Rail jumeau » — Keko, 23/11 : « la traînée du
   * railgun laisse un sillon électrique — et de gel si on a Cryogénie ») : là où la balle passe, elle laisse un sillon qui
   * crépite `duree` secondes ; tout insecte dedans (à `largeur` de sa course, plus son rayon) perd `part` fois les dégâts
   * de l'arme par seconde — et, si l'arme gèle (`gel`), il est gelé. L'état est `Monde.sillons`.
   */
  sillon?: { duree: number; part: number; largeur: number }
  fragments?: { nombre: number; degats: number; vitesse: number; vie: number }
  de?: { roule: number; chute: number; /** La zone d'un 4. */ rayon: number; /** Ce que chaque point du dé ajoute à la zone (ou lui retire, sous 4). */ pas: number }
  /**
   * LA COUPE (la troisième arme du Tesseract, Keko, 18/11 : « je voudrais bien voir ce que ça donne visuellement, la
   * coupe » — de mes idées : un objet de plus de dimensions qui traverse notre plan n'y paraît que par tranches) : à la
   * cadence, un insecte à `portee` (le verrouillé d'abord, sinon celui qui a le plus de voisins à moins de `rayon`), UN
   * CUBE TRAVERSE LE PLAN DU JEU EN BIAIS, là où il est, en `duree` secondes — le plan perpendiculaire à sa grande
   * diagonale : on n'en voit que LA COUPE (`coupeDUnCube`), un point qui s'ouvre en triangle, devient hexagone, se
   * referme en triangle retourné, puis en point ; elle tourne sur elle-même (`tour` radians par seconde) et son plus
   * grand sommet est à `rayon`. Toutes les `periode` secondes, TOUT INSECTE DANS LA COUPE (à son rayon près) perd
   * `degats`. Elle ne bouge pas. L'état est `Monde.coupes`.
   * (… ET SON POINT FINAL FRAPPE FORT — Keko, 18/11 : « quand la zone se referme en un seul point, la cible sous ce point
   * prend des dégâts très importants ; ça rend la zone un peu différente, et sur les boss, qui prennent beaucoup de place,
   * ça lui permet d'être efficace » : quand la tranche se referme, tout insecte dont le corps couvre son centre perd
   * `fin` d'un coup)
   */
  coupe?: { duree: number; rayon: number; periode: number; tour: number; /** Le coup du point final, à ce qui est dessous. */ fin: number }
  // (SA CIBLE MORTE, il ne reprend qu'un insecte à moins de `reprise` de lui, et repart en zigzag — voir `traquer`)
  essaim?: { nombre: number; eventail: number; acces: number; pointe: number; braquage: number; chaos: number; pas: number; calme: number; reprise: number }
}

export type Vaisseau = {
  x: number
  y: number
  vx: number
  vy: number
  /** Le cap du nez, en radians (0 vers la droite, −π/2 vers le haut). */
  cap: number
  /** La poussée en cours, 0 à 1 : la flamme du moteur la suit. */
  poussee: number
  /** Le chemin parcouru, en unités. */
  parcouru: number
  /** L'astéroïde contre lequel on était au pas précédent (`null` sinon) : un contact qui dure n'est pas un nouveau choc. */
  contact: number | null
}

/** Les trois minerais, du commun au rare. */
export const MINERAIS = ['fer', 'or', 'cristal'] as const
export type Minerai = (typeof MINERAIS)[number]
/** Tant de pépites de chaque minerai. */
export type Cargaison = Record<Minerai, number>
export const cargaisonVide = (): Cargaison => ({ fer: 0, or: 0, cristal: 0 })
/** Le nombre de pépites d'une cargaison. */
export const totalDe = (c: Cargaison): number => c.fer + c.or + c.cristal
/** Une roche : son minerai et sa richesse (0,25 à 1) disent ce qu'elle rend ; ses filons se voient dessus. */
export type Asteroide = { id: number; x: number; y: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number; minerai: Minerai; richesse: number }
/** Un laser posé sur sa roche : laquelle, le point d'impact, la part déjà creusée (0 à 1). *Il a visé le rival un temps ; la foreuse ne sert plus qu'aux roches (Keko).* */
export type Forage = { sorte: 'roche'; cible: number; x: number; y: number; part: number }
export type Pepite = { id: number; x: number; y: number; vx: number; vy: number; graine: number; minerai: Minerai; /** Sa valeur (au vortex, en points d'expérience) : 1, 3 ou 10 — une petite, une moyenne, une grosse ; 1 si absente. */ valeur?: number; /** EMPORTÉ PAR L'ANNEAU D'UNE BOULE MAGNÉTIQUE (son id — voir `Arme.sphere.magnetisme`) : il se referme avec lui, et compte au centre. */ emportee?: number; /** L'AIMANT (voir `invasion.aimant`) : pris, il attire toutes les pépites. */ aimant?: boolean; /** UNE PLAQUE (voir `recuperation`) : prise, elle restaure une plaque cassée ; personne n'en manque, elle attend. */ plaque?: boolean; /** UN SOIN (voir `invasion.soin`) : pris, il rend du blindage ; personne n'est blessé, il attend. */ soin?: boolean; /** L'instant où l'aimant du JOUEUR l'a prise : elle ne le lâche plus (voir plus bas, « une pépite aimantée »). */ aimanteeA?: number; /** À plusieurs : le pilote qui l'aimante (voir `avancerLEquipage`). */ par?: number }
/** Un choc contre un astéroïde : où, et avec quelle vitesse normale (pour l'étincelle et la vibration). */
export type Choc = { x: number; y: number; force: number; asteroide: number; /** Le vaisseau a TRAVERSÉ la roche, trop légère pour lui : la part de sa vitesse qu'il y a laissée (roche ÷ vaisseau). */ perce?: number }
/** Un trait tiré par l'ennemi. */
/** (un trait du rival armé porte les dégâts de son arme, son nom, et s'il est guidé — absents : le trait d'avant, un point) */
export type Tir = { id: number; x: number; y: number; vx: number; vy: number; vie: number; degats?: number; guide?: boolean; arme?: string }
/** Un obus du joueur : un trait qui porte des dégâts, de l'arme qui l'a tiré ; guidé, il tourne vers le rival. */
export type Obus = Tir & { degats: number; guide: boolean; arme: string; /** Ses ricochets qui restent (voir `Arme.ricochet`), ceux qu'il a déjà touchés (il ne les retouche pas en repartant). */ rebonds?: { n: number; portee: number; part: number }; deja?: number[]; /** Ses dégâts sans le coup critique : un rebond retire le sien (voir `Arme.ricochet`). */ brut?: number; /** Ce qu'il enflamme (voir `Arme.incendiaire`). */ brule?: { duree: number; dps: number }; /** Les éclats de son explosion (voir `Arme.fragments`). */ fragments?: { nombre: number; degats: number; vitesse: number; vie: number }; /** L'insecte auquel il est accroché (voir `Arme.infaillible`). */ verrou?: number; /** Un coup critique (le passif du labo) : ses dégâts sont déjà multipliés. */ critique?: boolean; /** Il explose (voir `Arme.zone`). */ zone?: { rayon: number; degats: number }; /** Il gèle ce qu'il touche (voir `Arme.gel`). */ gel?: { duree: number; ralenti: number }; /** Il ronge ce qu'il touche (voir `Arme.corrosif`). */ ronge?: { duree: number; bonus: number }; /** Il électrocute ce qu'il touche (voir `Arme.electrocution`). */ electrocution?: { duree: number; chance: number; degats: number; saut: number }; /** Il détone sur un coup critique (voir `Arme.detonation`). */ detonation?: { rayon: number; part: number }; /** Critique, il exécute (voir `Arme.execute`). */ execute?: boolean; /** Il laisse un sillon (voir `Arme.sillon`) : sa durée, ce qu'il fait par seconde, sa largeur, son gel. */ sillon?: { duree: number; dps: number; largeur: number; gel?: { duree: number; ralenti: number }; electrocution?: { duree: number; chance: number; degats: number; saut: number } }; /** Il traverse (voir `Arme.salve`) : les insectes déjà touchés. */ perce?: number[]; /** Une balle de railgun (voir `Arme.balle`) : la part de ses dégâts qu'elle garde à chaque insecte traversé, son calibre. */ balle?: { part: number; calibre: number }; /** Il se brise au premier insecte touché en petits fragments, en cône derrière lui (voir `Arme.salve`). */ eclatement?: { nombre: number; cone: number; vitesse: number; vie: number; degats: number }; /** Un missile d'essaim (voir `Arme.essaim`) : sa cible, sa naissance, sa vitesse de départ, et comment il fonce. */ traque?: { cible: number; nee: number; v0: number; acces: number; pointe: number; braquage: number; chaos: number; pas: number; calme: number; reprise: number; /** L'instant où il a repris une autre cible (la sienne morte) : son chaos repart de là. */ depuis?: number }; /** Une boule de napalm, lancée en cloche (voir `Arme.napalm`) : sa durée de vol au départ ; elle ne touche rien en vol. */ napalm?: { rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }; vie0?: number; /** Un obus tiré en cloche (voir `Arme.cloche`) : il ne touche rien en vol, il explose en retombant. */ cloche?: boolean; /** Une grenade à retardement (voir `Arme.minuterie`) : son frein par seconde ; elle ne touche rien, elle explose au bout de sa vie. */ minuterie?: number }
/** Une bombe en vol (la capacité active d'essai). */
export type Bombe = Tir
/** Le rival : un vaisseau comme l'autre, des points, ce qu'il fait, sa roche, son laser, son prochain tir, son butin. */
export type Ennemi = {
  id: number
  corps: Vaisseau
  pv: number
  /** (`marche` et `aggro` : un insecte de l'invasion — il marche vers le portail, ou il chasse le joueur) */
  fait: 'mine' | 'chasse' | 'fuit' | 'marche' | 'aggro'
  /** Un insecte : jusqu'à quand il ne se laisse plus distraire ; sa prochaine morsure ; il a traversé le portail. */
  calmeA?: number
  mordA?: number
  parti?: boolean
  roche: number | null
  forage: Forage | null
  tirA: number
  /** Le prochain tir de CHACUNE de ses armes, quand il en porte (`ennemi.armes`). */
  tirsA?: number[]
  /** IL BRÛLE (le lance-flammes) jusqu'à cet instant, à tant de points par seconde. */
  bruleA?: number
  dpsBrulure?: number
  dureeBrulure?: number
  /** IL EST GELÉ (le givre) jusqu'à cet instant, et avance à cette part de sa vitesse. */
  geleA?: number
  ralenti?: number
  /** IL EST RONGÉ PAR L'ACIDE (voir `Arme.crachat`) jusqu'à cet instant : il perd tant par seconde, et tout ce qu'il perd d'autre est majoré de cette part. */
  acide?: { jusque: number; dps: number; bonus: number }
  /** IL EST FIGÉ jusqu'à cet instant — pris dans la glace (« Gel profond ») : immobile, il ne mord pas (voir `ELEMENTAIRES`). */
  figeA?: number
  fige?: 'glace'
  /** IL EST ÉLECTROCUTÉ (voir `Arme.electrocution`) jusqu'à cet instant : chaque coup direct a cette chance de faire sauter un arc. */
  electrocute?: { jusque: number; chance: number; degats: number; saut: number }
  /** IL EST IRRADIÉ (voir `Arme.balise.irradie`) : il est sur un faisceau de cristaux, jusqu'à cet instant (à peine au-delà : pour le dessin). */
  irradie?: { jusque: number }
  /** IL EST EMPOISONNÉ (la traînée de poison du Ver) jusqu'à cet instant (pour le dessin). */
  poisonA?: number
  /**
   * L'ÉTAT EMPOISONNÉ (les mines de la Vouivre, Keko, 19/11) : jusqu'à cet instant, il perd `dps` par seconde — le plus
   * long et le plus fort l'emportent ; il le montre comme dans la traînée (`poisonA`).
   */
  poison?: { jusque: number; dps: number }
  /** IL EST TENU PAR UNE VRILLE (voir `Arme.vrille`) jusqu'à cet instant : immobilisé sur place. */
  tenuA?: number
  /** SA SORTE, s'il n'est pas un petit : le cornu, le cuirassier (voir `invasion.cornu`, `invasion.cuirassier`). */
  sorte?: SorteDInsecte
  /** UN GRAND : un mini-boss, un boss (aucun encore) — une vrille le saisit sans l'immobiliser. */
  grand?: boolean
  /** Un grand qui est UN BOSS (sinon, un mini-boss) — voir `invasion.recompense`. */
  boss?: boolean
  /**
   * L'instant où il a perdu de la vie AUTREMENT QUE PAR UNE ARME — la tempête, l'explosion du retour, une roche (23/11) — : la page n'en fait
   * pas un chiffre de dégâts (Keko, 22/11 : « des chiffres blancs énormes » — l'explosion du retour montrait toute la vie
   * qui restait aux insectes qu'elle abat, des milliers au niveau 60).
   */
  horsArmeA?: number
  /** Son dernier choc contre une roche qui dérive (voir `sansPortail`). */
  heurteA?: number
  /** UN ASTÉROÏDE QUI DÉRIVE (voir `derive`) : sa taille, son dessin (graine, angle, rotation), ses points au départ. */
  asteroide?: { rayon: number; graine: number; angle0: number; vitesseAngulaire: number; pvMax: number }
  butin: number
  cargaison: Cargaison
}

/** Tout le monde : le joueur, les ennemis, ce que les lasers ont creusé, les roches parties, les pépites, les traits, le minerai. */
export type Monde = {
  t: number
  /** En vol ; perdu (la coque percée) ; extrait (resté à quai jusqu'au bout du compte : la partie est finie, gagnée). */
  phase: 'vol' | 'perdu' | 'extrait'
  vaisseau: Vaisseau
  coque: number
  /** Le bouclier qui reste (voir la configuration), et l'instant du dernier coup reçu (il se recharge passé un délai). */
  bouclier: number
  /** Les plaques de blindage, de la portion du haut de la barre à celle du bas : vrai, elle tient (voir la configuration). */
  plaques: boolean[]
  /** Le blindage plein de ce pilote (sa configuration, posée à chaque pas) : à plusieurs, les autres savent s'il est blessé — voir `invasion.soin`. */
  coqueMax?: number
  /** LE TABLEAU DE CE PILOTE (voir `invasion.points`) : ses insectes abattus et leurs points, ses roches détruites et les leurs — le coup fatal seul. */
  tableau: Tableau
  /** Jusqu'à quel instant (`t` du monde) le joueur ne prend plus de coup — voir `invulnerabilite`. */
  intouchableJusque: number
  /** La part de la coque qui est corrompue (en points, jamais plus que la coque) — voir la configuration. */
  corruption: number
  /** Jusqu'à quel instant (`t` du monde) le joueur est déphasé — voir `dephasage`. */
  dephaseJusque: number
  /** Quand une plaque a cassé pour la dernière fois, ou a été réparée (voir `reparation`). */
  plaqueCasseeA: number
  /** Jusqu'à quel instant le joueur revenu est invincible et passe au travers de tout — voir `invasion.retour` ; -100 : rien. */
  renaitJusque: number
  /** Les roches qui dérivaient et que la tempête a prises : elles tournent avec les siennes (voir `menerLesRochesPrises`). */
  rochesPrises: RochePrise[]
  toucheA: number
  forage: Forage | null
  /** Le laser de CHAQUE foreuse du joueur, dans l'ordre de `foreuses` (`forage` reste le premier qui creuse). */
  forages: (Forage | null)[]
  ennemis: Ennemi[]
  prochainEnnemiA: number
  /** La prochaine roche qui dérive (voir `derive`). */
  prochaineDeriveA: number
  /** L'invasion : la vague en cours, ce qu'il lui reste à faire naître, l'instant de la prochaine naissance, ceux qui ont traversé le portail, ceux qu'on a abattus. */
  invasion: { vague: number; aNaitre: number; prochainA: number; passes: number; abattus: number; /** L'expérience du niveau en cours, le niveau (1 au départ), l'instant du retour d'un joueur abattu. */ xp: number; niveau: number; retourA: number; /** La vie du portail, en pour cent ; à zéro, la partie est finie. */ vie: number; /** Les vies de l'équipage (voir `invasion.vies`). */ vies: number; /** Les mini-boss et les boss abattus, par toute l'équipe (voir `invasion.recompense`). */ miniBoss: number; boss: number; finie: boolean; /** Les cadrans d'où vient la vague en cours (0 : est-sud, puis en tournant), et combien de ses insectes sont nés. */ cadrans: number[]; nes: number }
  tirs: Tir[]
  /** Les obus du joueur, et l'instant où chaque arme montée peut tirer à nouveau. */
  obus: Obus[]
  armesA: number[]
  /** Les points creusés par roche (son id), tant qu'elle tient. */
  creuse: Map<number, number>
  /**
   * … et, parmi eux, LES POINTS CREUSÉS À LA FOREUSE (Keko, 12/11 : « si un astéroïde est cassé autrement que par les
   * foreuses il ne donne pas de minerai : son drop est proportionnel au % de sa vie enlevé via foreuse ») : une roche
   * brisée par un choc, un obus ou une bombe ne rend que la part de ses pépites qu'un laser a creusée.
   */
  fore: Map<number, number>
  detruits: Set<number>
  pepites: Pepite[]
  /** Le minerai PORTÉ (à bord, perdu avec la coque), et la BANQUE : le total extrait, qui ne bouge qu'à une extraction — en nombre de pépites, et par minerai (`cargaison`, `tresor`). */
  minerai: number
  banque: number
  cargaison: Cargaison
  /**
   * LES MINERAIS REFUSÉS (Keko, 11/11 : « une option dans le panneau soute pour bloquer la collecte d'un élément ») :
   * une pépite d'un minerai refusé n'est ni aimantée ni ramassée par le joueur — comme si la soute était pleine pour
   * elle. Le rival, lui, la prend.
   */
  refuses: Record<Minerai, boolean>
  tresor: Cargaison
  /** Le compte de l'extraction (secondes passées à quai d'affilée), et si le vaisseau est déjà sorti d'un parvis. */
  extraction: number
  sorti: boolean
  /** L'instant du dernier départ de la postcombustion (très ancien : jamais). */
  boostA: number
  /** Les bombes en vol, et les charges qui restent pour ce vol. */
  bombes: Bombe[]
  charges: number
  prochainId: number
  graine: number
  /**
   * L'ENNEMI VERROUILLÉ (Keko, 15/11 : « quand on tape sur un ennemi, un petit verrouillage s'affiche dessus ; il devient
   * l'ennemi prioritaire, s'il est à portée de tir ; une seconde tape le déverrouille ») : son id, ou null. Il tombe
   * avec l'ennemi.
   */
  verrou: number | null
  /** Le lance-flammes crache, à ce pas (le dessin et le son le lisent). */
  crache: boolean
  /** LES DRONES, un par arme à orbite (dans leur ordre) : où ils sont, leur vitesse, l'ennemi qu'ils attaquent. */
  drones: Drone[]
  /** LES TOURELLES POSÉES (voir `Arme.pose`) : où, depuis quand, leur canon, leur prochain tir, l'arme qui les a posées. */
  tourelles: Tourelle[]
  /** LES FLAQUES DE NAPALM (voir `Arme.napalm`). */
  flaques: Flaque[]
  /** LE TOUR DU RAYON en cours (voir `Arme.balayage`) : l'arme, son début, l'angle atteint, les ennemis déjà touchés ; ou null. */
  // (`ligne` : le trait au sol d'un rayon qui trace, en coordonnées du monde — voir `Arme.balayage.trace`)
  balayage: { arme: number; debut: number; angle: number; touches: number[]; depart: number; sens: number; posees: number; ligne?: { x0: number; y0: number; x1: number; y1: number }; suivi?: { id: number; x: number; y: number } } | null
  /** Le dernier insecte que le rayon a vu à sa portée : où, et quand (voir `menerLeRayon`) ; null avant. */
  rayonVu: { x: number; y: number; t: number } | null
  /** LE RAYON CANALISÉ (voir `Arme.canalise`) : sa cible, depuis quand il est dessus, où elle est, sa chauffe (0 à 1) ; ou null. */
  canal: { arme: number; cible: number; depuis: number; x: number; y: number; chauffe: number } | null
  /** LES HARPONS (voir `Arme.harpon`) : un par arme, en vol ou plantés (`plante`, l'instant où il s'est planté). */
  harpons: Harpon[]
  /** OÙ EN EST LA RAFALE DE CHAQUE ARME (voir `Arme.rafale`) : les tirs déjà partis, par arme ; et celle des ailes, partagée. */
  rafales: number[]
  rafaleDesAiles: number
  /** L'INSTANT DE LA DERNIÈRE SALVE DES AILES JUMELÉES (voir `Arme.jumele`) : celle qui tire la première entraîne les autres. */
  salveDesAiles: number
  /** LES RAYONS CONCENTRÉS (voir `Arme.concentre`) : leur arme, leur cible, leur naissance, ce qu'ils rongent par seconde. */
  faisceaux: { arme: number; cible: number; nee: number; dps: number; /** Ses rebonds de l'image (voir `Arme.concentre`). */ chaine?: number[] }[]
  /** LES SILLONS ÉLECTRIQUES (voir `Arme.sillon`) : un par balle, sa course en segments, sa naissance, ce qu'il fait. */
  sillons: Sillon[]
  /** LES SCIES EN VOL (voir `Arme.scie`) ; une arme dont la scie n'y est pas l'a à bord. */
  scies: Scie[]
  /** LES BALISES POSÉES (voir `Arme.balise`). */
  balises: Balise[]
  /** LES PLAQUES DE GIVRE (voir `Arme.givre`). */
  givres: Givre[]
  /** LES TORNADES DE GIVRE (voir `Arme.tornade`). */
  tornades: Tornade[]
  /** LES ONDES DE NOVA qui s'ouvrent (voir `Arme.nova`) : leur arme, leur cœur, leur naissance, les insectes déjà frappés. */
  novas: { arme: number; x: number; y: number; nee: number; frappes: number[] }[]
  /** LES ÉCHARDES DE GIVRE qui attendent autour du vaisseau (voir `Arme.condense`) : leur arme, leur naissance, leur place, leur départ prévu et leur rang dans la rafale. */
  echardes: { id: number; arme: number; nee: number; place: number; depart?: number; rang?: number }[]
  /** LES SPHÈRES DE PLASMA (voir `Arme.sphere`). */
  spheres: Sphere[]
  /** LES PUITS DE PLASMA (voir `Arme.puits`). */
  puits: Puits[]
  /** LES MÉTÉORES D'ARCANE qui tombent (voir `Arme.meteore`) : leur insecte, le point visé, quand elles sont parties, quand elles frappent. */
  meteores: { id: number; arme: number; cible: number; x: number; y: number; lancee: number; tombe: number }[]
  /** LES TENTACULES (voir `Arme.tentacule`) : une par ancre, au repos ou non. */
  tentacules: Tentacule[]
  /** LES NUAGES D'INSECTES (voir `Arme.nuee`) : un par arme, où (sur le vaisseau), la dernière morsure signalée, ses bras — leur insecte, leur allongement (0 à 1), le dernier point où il était. */
  nuees: { arme: number; x: number; y: number; mordA: number; bras: { cible: number; u: number; tx: number; ty: number }[]; /** Ce qu'elle a mangé : la part de dégâts qu'elle a gagnée (0 à `festin.max`). */ croissance: number }[]
  /** LES REJETONS (voir `Arme.rejeton`). */
  rejetons: Rejeton[]
  /** LES FLAQUES D'ACIDE (voir `Arme.crachat`) : un cône au sol — sa pointe, son cap, quand il est né, son arme. */
  flaquesAcides: { id: number; arme: number; x: number; y: number; cap: number; nee: number }[]
  /** LES MINES D'ACIDE (voir `Arme.mine`) : d'où elles partent, où elles tombent, quand elles ont été lancées. */
  mines: { id: number; arme: number; x0: number; y0: number; x: number; y: number; lancee: number }[]
  /** LES FLÉAUX (voir `Arme.fleau`) : un par arme — la masse, sa vitesse, quand elle a frappé chaque insecte. */
  fleaux: { arme: number; x: number; y: number; vx: number; vy: number; frappes: Record<number, number>; frappesChaine: Record<number, number> }[]
  /** LES PARASITES (voir `Arme.parasite`) : en vol vers leur cible, ou accrochés à leur hôte ; où, leur vitesse, depuis quand. */
  // (`bond` : il saute d'un hôte mort au suivant — d'où, en combien de temps ; voir `menerLesParasites`)
  parasites: { id: number; arme: number; hote: number | null; cible: number | null; x: number; y: number; vx: number; vy: number; depuis: number; bond?: { x0: number; y0: number; duree: number } }[]
  /** LES ÉPINES D'OS DU VER EN VOL (voir `Arme.epines`) : où, leur vitesse, ce qu'il leur reste à voler, qui elles ont touché. */
  brochettes: { id: number; arme: number; x: number; y: number; vx: number; vy: number; vie: number; touches: number[] }[]
  /** LES HYPERCUBES DU TESSERACT (voir `Arme.hypercube`) : le bond en cours (d'où, où, quand il est parti, combien de temps), son cap, ses contacts au sol. */
  hypercubes: { id: number; arme: number; x0: number; y0: number; x1: number; y1: number; depart: number; duree: number; cap: number; contacts: number; /** L'insecte visé, et le contact qui doit tomber sur lui (1 à `rebonds`). */ cible: number | null; vise: number }[]
  /** LES COUPES DU TESSERACT (voir `Arme.coupe`) : où, quand elles ont paru, leur angle de départ, l'heure de leur prochain coup. */
  coupes: { id: number; arme: number; x: number; y: number; nee: number; angle: number; prochain: number }[]
  /** LES DÉS DU TESSERACT (voir `Arme.de`) : leur insecte, le point visé (qui le suit), quand ils ont paru, quand ils frappent, le chiffre tiré. */
  des: { id: number; arme: number; cible: number; x: number; y: number; lance: number; tombe: number; face: number }[]
  /** LES ŒUFS DU VER (voir `Arme.ponte`) : où, leur cap, quand ils ont été pondus. */
  oeufs: { id: number; arme: number; x: number; y: number; cap: number; pondu: number }[]
  /** LES MINI-VERS (voir `Arme.ponte`) : où, leur cap, quand ils sont nés, leur proie, leur prochaine morsure. */
  miniVers: { id: number; arme: number; x: number; y: number; cap: number; ne: number; cible: number | null; mordA: number }[]
  /** LES LIENS DU DRAIN D'ÂME (voir `Arme.drain`) : son arme, l'âme accrochée, depuis quand. */
  liens: { arme: number; cible: number; depuis: number }[]
  /** LES BALISES LASER (voir `Arme.lien`) : leur arme, où elles sont, leur élan, leur naissance. */
  balisesLaser: BaliseLaser[]
  /** LES VRILLES D'OMBRE (voir `Arme.vrille`) : où elles sont sorties, quand, leur prochain coup, leur dernière proie. */
  vrilles: { id: number; arme: number; x: number; y: number; nee: number; libreA: number; cible: number | null; saisieA: number; signaleA: number }[]
  /** L'ÉQUIPAGE, à plusieurs (voir `avancerLEquipage`) ; absent, on vole seul. */
  equipage?: Equipage
}

/** Un rejeton du Kraken (voir `Arme.rejeton`) : son arme, où, sa vitesse, quand il est né, sa proie, son prochain coup. */
export type Rejeton = { id: number; arme: number; x: number; y: number; vx: number; vy: number; nee: number; cible: number | null; frappeA: number }

/**
 * Une tentacule (voir `Arme.tentacule`) : son arme, son ancre, ce qu'elle fait (au repos, elle s'étend, plantée, elle se
 * rétracte) et depuis quand ; sa cible et le dernier point où elle était ; son allongement (0 à 1) ; son virage (signé).
 */
export type Tentacule = { arme: number; ancre: number; fait: 'repos' | 'aller' | 'plantee' | 'retour'; depuis: number; cible: number | null; tx: number; ty: number; u: number; virage: number }

/** Une sphère de plasma (voir `Arme.sphere`) : son arme, où, sa vitesse, quand elle est née, quand elle tire. */
// (`charge` : ce que ses coups critiques lui ont ajouté — voir `Arme.sphere.accumulateur`)
// (`pousses` : les insectes que l'anneau de ce tour a déjà poussés — voir `Arme.sphere.magnetisme` ; `tour`, son rang)
export type Sphere = { id: number; arme: number; x: number; y: number; vx: number; vy: number; nee: number; tirA: number; charge?: number; tour?: number; pousses?: number[] }
/** Un puits de plasma (voir `Arme.puits`) : son arme, d'où il part, où il s'ouvre, où il est ; quand il arrive ; ouvert ou en vol. */
export type Puits = { id: number; arme: number; x0: number; y0: number; cx: number; cy: number; x: number; y: number; lance: number; arrive: number; ouvert: boolean }

/** Une tornade de givre (voir `Arme.tornade`) : son arme, où, sa vitesse, quand elle est née. */
export type Tornade = { id: number; arme: number; x: number; y: number; vx: number; vy: number; nee: number }

/** Une plaque de givre semée par le vaisseau (voir `Arme.givre`). */
export type Givre = { id: number; arme: number; x: number; y: number; nee: number; rayon: number; duree: number; dps: number; ralenti: number; /** De poison (le Ver), pas de givre ; de verglas (la nova). */ poison?: boolean; verglas?: boolean; corrosion?: { duree: number; bonus: number } }

/** Une balise posée (voir `Arme.balise`) : où, quand, son arme, la balise à laquelle elle est reliée (son id, ou null), le prochain tir de leur paire. */
export type Balise = { id: number; x: number; y: number; nee: number; arme: number; /** Son rang dans son trio (0, 1, 2 : la troisième ferme le triangle), et son trio (l'id de sa première balise). */ rang: number; trio: number; /** Les balises auxquelles elle est reliée (posées avant elle), et pour chaque ligne les insectes qui sont dessus et l'instant de sa prochaine décharge s'ils y restent. */ liens: { vers: number; sur: number[]; dechargeA: number }[] }

/** Une scie lancée (voir `Arme.scie`) : son arme, où, sa vitesse, sa direction de départ, quand, si elle revient, ceux qu'elle a touchés dans ce sens. */
export type Scie = { id: number; arme: number; x: number; y: number; vx: number; vy: number; cap0: number; lancee: number; revient: boolean; touches: number[] }

/** Une flaque de feu au sol (voir `Arme.napalm`). */
export type Flaque = { id: number; x: number; y: number; nee: number; rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }

/** Une tourelle posée dans le monde (voir `Arme.pose`). */
export type Tourelle = { id: number; x: number; y: number; nee: number; cap: number; tirA: number; arme: number; /** LANCÉE : d'où, quand ; elle se déploie à `nee` (avant, elle vole). */ x0: number; y0: number; lancee: number; deployee: boolean }

/** Un drone en vol (voir `Arme.orbite`). */
/** (`cap` : où son nez regarde — vers sa cible quand il en a une, voir `menerLesDrones`.) */
export type Drone = { x: number; y: number; vx: number; vy: number; cible: number | null; cap?: number }

/** Ce qui s'est passé pendant un pas, pour le dessin et le son. */
export type Evenement =
  | { type: 'plaqueReparee'; k: number }
  | { type: 'aimant'; x: number; y: number }
  /** Un soin ramassé (voir `invasion.soin`). */
  | { type: 'soin'; x: number; y: number }
  | { type: 'eclat'; x: number; y: number; rayon: number; graine: number; minerai: Minerai }
  | { type: 'ramasse'; x: number; y: number; par: 'joueur' | 'ennemi'; minerai: Minerai }
  /** Une pépite déposée à la station. */
  | { type: 'extrait'; x: number; y: number; pepites: number; cargaison: Cargaison }
  | { type: 'tir'; x: number; y: number }
  | { type: 'touche'; x: number; y: number }
  /** Le bouclier a pris le coup à la place de la coque. */
  | { type: 'bouclier'; x: number; y: number }
  /** Une plaque de blindage a pris le coup, et cassé (`k` : laquelle, depuis la première). */
  | { type: 'plaque'; x: number; y: number; k: number }
  /** Le coup a corrompu la coque (les Innommés) : elle ne baisse pas encore. */
  | { type: 'corrompu'; x: number; y: number }
  /** Le coup a été esquivé : le vaisseau entre en déphasage (voir `dephasage`). */
  | { type: 'dephase'; x: number; y: number }
  /** Un insecte abattu a purgé de la corruption (`x`, `y` : où il est mort). */
  | { type: 'purge'; x: number; y: number }
  /** Une arme du joueur tire. */
  | { type: 'obus'; x: number; y: number; arme: string }
  | { type: 'ennemiApparait'; id: number; x: number; y: number }
  /** Une tourelle est lancée ; elle se déploie (posée) ; une tourelle s'éteint (sa durée est passée, ou une plus jeune l'a remplacée). */
  | { type: 'tourelleLancee'; x: number; y: number }
  | { type: 'tourellePosee'; x: number; y: number }
  /** Un arc électrique d'un drone (son rang, `drone`) à sa cible (`id`), d'un point à l'autre (voir `Arme.eclair`). */
  | { type: 'arc'; x0: number; y0: number; x1: number; y1: number; drone: number; id: number }
  /** Une chaîne d'éclairs : du vaisseau, puis de cible en cible — `ids`, les ennemis touchés, dans l'ordre (voir `Arme.chaine`). */
  | { type: 'chaine'; points: Vecteur[]; ids: number[] }
  /** Le rayon commence son tour (voir `Arme.balayage`). */
  | { type: 'balayage'; duree: number; arme: string }
  /** Une scie part ; le vaisseau la rattrape (voir `Arme.scie`). */
  | { type: 'scieLancee'; x: number; y: number; arme: string }
  | { type: 'scieRattrapee'; x: number; y: number }
  /** Une balise est posée ; une balise s'éteint ; une ligne entre deux balises, franchie, s'éclaire (voir `Arme.balise`). */
  | { type: 'balisePosee'; x: number; y: number; arme: string }
  | { type: 'baliseFinie'; x: number; y: number; arme: string }
  | { type: 'ligne'; x0: number; y0: number; x1: number; y1: number; arme: string }
  /** Une boule de napalm s'écrase en flaque de feu (voir `Arme.napalm`). */
  | { type: 'flaque'; x: number; y: number; rayon: number }
  /** Un mini-missile explose (voir `Arme.zone`). */
  | { type: 'explosionDeZone'; x: number; y: number; rayon: number; /** L'arme qui éclate (l'orbe de plasma a sa gerbe à elle). */ arme?: string }
  | { type: 'tourelleFinie'; x: number; y: number }
  /** Un obus touche le rival. */
  | { type: 'ennemiTouche'; id: number; x: number; y: number; critique: boolean }
  | { type: 'ennemiDetruit'; id: number; x: number; y: number; vx: number; vy: number; /** Il est mort EN BRÛLANT (le lance-flammes) : il se consume au lieu d'éclater. */ brule?: boolean; /** Il est mort GELÉ (le givre) : il vole en éclats de glace. */ gele?: boolean }
  /** Une tornade de givre part du vaisseau ; elle s'éteint (voir `Arme.tornade`). */
  | { type: 'tornade'; x: number; y: number; arme: string }
  | { type: 'tornadeFinie'; x: number; y: number }
  /** Une salve part tout autour du vaisseau (voir `Arme.salve`). */
  | { type: 'salve'; x: number; y: number; arme: string }
  /** Une écharde de givre se condense autour du vaisseau ; une écharde part (voir `Arme.condense`). */
  | { type: 'condensation'; x: number; y: number }
  | { type: 'echarde'; x: number; y: number; arme: string }
  /** Un éclat se brise sur un insecte, ses fragments partent en cône derrière lui, le long de `cap` (voir `Arme.salve`). */
  | { type: 'eclatement'; x: number; y: number; cap: number }
  /** Un essaim de missiles part (voir `Arme.essaim`), de la bouche. */
  | { type: 'essaim'; x: number; y: number; arme: string }
  /** Une sphère de plasma part (voir `Arme.sphere`), s'éteint, tire ses petits traits (combien). */
  | { type: 'sphere'; x: number; y: number; arme: string }
  /** Un puits de plasma part, s'ouvre, éclate (voir `Arme.puits`). */
  | { type: 'puits'; x: number; y: number; arme: string }
  | { type: 'puitsOuvert'; x: number; y: number; rayon: number }
  | { type: 'puitsEclate'; x: number; y: number; rayon: number }
  /** Une météore d'arcane part du ciel ; elle frappe le sol (voir `Arme.meteore`). */
  | { type: 'meteore'; id: number; x: number; y: number; arme: string; /** La bouche du vaisseau au lancer : c'est de là qu'elle est appelée. */ x0: number; y0: number }
  | { type: 'meteoreImpact'; id: number; x: number; y: number }
  | { type: 'sphereFinie'; x: number; y: number }
  | { type: 'sphereTir'; x: number; y: number; tirs: number }
  /** Un railgun tire (voir `Arme.rail`) : le trait, de la bouche au bout de la portée. */
  | { type: 'rail'; x0: number; y0: number; x1: number; y1: number; arme: string }
  /** La bobine tesla foudroie un insecte (voir `Arme.sphere.foudre`). */
  | { type: 'foudre'; x0: number; y0: number; x1: number; y1: number }
  /** Un harpon se plante dans sa cible, ou son câble casse (voir `Arme.harpon`). */
  | { type: 'harponPlante'; x: number; y: number; id: number }
  /** Un coup critique détone (voir `Arme.detonation`). */
  | { type: 'detonation'; x: number; y: number; rayon: number }
  /** Une balle laisse un sillon électrique (voir `Arme.sillon`). */
  | { type: 'sillon'; x: number; y: number; gel: boolean; electrique: boolean }
  /** Un coup critique exécute un insecte qui en aurait réchappé (voir `Arme.execute`) : où, et sa taille. */
  | { type: 'execution'; x: number; y: number; rayon: number }
  | { type: 'harponCasse'; x: number; y: number }
  /** La balle du railgun traverse un insecte (voir `Arme.balle`), là où il est, filant à `cap`. */
  | { type: 'balleTraverse'; x: number; y: number; cap: number }
  /** Une tentacule s'étend vers un insecte, le pique (voir `Arme.tentacule`). */
  | { type: 'tentacule'; x: number; y: number }
  | { type: 'piqure'; x: number; y: number }
  /** Le nuage d'insectes mord un insecte (voir `Arme.nuee`) : signalé toutes les `periode` secondes. */
  | { type: 'morsure'; id: number; x: number; y: number }
  /** Un rejeton naît, fouette sa proie (où elle est), s'éteint (voir `Arme.rejeton`). */
  | { type: 'rejeton'; x: number; y: number }
  | { type: 'coupDeRejeton'; id: number; x: number; y: number }
  | { type: 'rejetonFini'; x: number; y: number }
  /** Une vrille d'ombre sort de sa flaque, saisit sa proie, la serre (signalé toutes les `periode` secondes), se fait arracher par un grand, rentre (voir `Arme.vrille`). */
  | { type: 'vrille'; id: number; x: number; y: number }
  /** Le Ver pond un œuf, il éclot, un mini-ver se dissout, un mini-ver mord (voir `Arme.ponte`). */
  | { type: 'oeuf'; x: number; y: number }
  | { type: 'eclosion'; id: number; x: number; y: number }
  | { type: 'miniVerFini'; id: number; x: number; y: number }
  | { type: 'morsureMiniVer'; id: number; x: number; y: number }
  /** Le Ver lance son épine d'os ; elle transperce un insecte ; elle finit sa course (voir `Arme.epines`). */
  | { type: 'epines'; x: number; y: number }
  | { type: 'transperce'; id: number; x: number; y: number }
  | { type: 'epineFinie'; x: number; y: number; cap: number }
  /** Le Tesseract lance son hypercube ; il touche le sol (son rang de contact, de 1 à `rebonds`) ; il s'éteint (voir `Arme.hypercube`). */
  | { type: 'hypercube'; x: number; y: number; arme: string }
  | { type: 'rebondHypercube'; id: number; x: number; y: number; rayon: number; contact: number }
  | { type: 'hypercubeFini'; x: number; y: number }
  /** Un dé du destin paraît au-dessus d'un insecte, son chiffre déjà tiré ; il s'abat (voir `Arme.de`). */
  | { type: 'de'; id: number; x: number; y: number; arme: string; face: number }
  | { type: 'deImpact'; id: number; x: number; y: number; face: number; rayon: number }
  /** Une coupe paraît (un cube commence à traverser le plan) ; elle se referme (voir `Arme.coupe`). */
  | { type: 'coupe'; id: number; x: number; y: number; arme: string }
  | { type: 'coupeFinie'; id: number; x: number; y: number; /** Combien d'insectes son point final a frappés. */ touches: number }
  /** Le drain d'âme accroche une âme (voir `Arme.drain`). */
  | { type: 'accroche'; id: number; x: number; y: number }
  | { type: 'saisie'; id: number; cible: number; x: number; y: number }
  | { type: 'serre'; id: number; x: number; y: number }
  | { type: 'arrache'; id: number; x: number; y: number }
  | { type: 'vrilleFinie'; id: number; x: number; y: number }
  /** La Vouivre crache (voir `Arme.crachat`) : la bouche, le cap, le cône ; un insecte se met à être rongé. */
  | { type: 'crachat'; x: number; y: number; cap: number; cone: number; portee: number; arme: string }
  | { type: 'ronge'; id: number; x: number; y: number }
  /** Une mine d'acide est lancée, éclate en gaz, s'éteint sans avoir servi (voir `Arme.mine`). */
  | { type: 'mineLancee'; x: number; y: number; arme: string }
  | { type: 'gaz'; x: number; y: number; rayon: number }
  | { type: 'mineFinie'; x: number; y: number }
  /** Le fléau frappe un insecte (voir `Arme.fleau`). */
  | { type: 'fleauFrappe'; x: number; y: number }
  | { type: 'chaineFrappe'; x: number; y: number }
  /** Un parasite est craché, s'accroche, saute à la mort de son hôte, meurt (voir `Arme.parasite`). */
  | { type: 'parasiteLance'; x: number; y: number; arme: string }
  | { type: 'parasiteAccroche'; id: number; x: number; y: number }
  | { type: 'parasiteSaute'; x: number; y: number }
  | { type: 'parasiteMort'; x: number; y: number }
  /** Un insecte entre dans le givre (il n'y était pas). */
  | { type: 'gele'; id: number; x: number; y: number }
  /** Un insecte se met à être électrocuté (il ne l'était pas) ; un arc d'électrocution saute de l'un à l'autre. */
  | { type: 'electrocute'; id: number; x: number; y: number }
  | { type: 'arcDElectrocution'; de: number; vers: number; x0: number; y0: number; x1: number; y1: number }
  /** Un insecte est figé (voir `Ennemi.figeA`) ; le feu se propage de l'un à l'autre (voir `propagerLeFeu`). */
  | { type: 'fige'; id: number; x: number; y: number; sorte: 'glace' }
  /** La foudre tombe du ciel sur un insecte électrocuté (« Foudre » — voir `foudroyer`). */
  | { type: 'foudreDuCiel'; id: number; x: number; y: number; rayon: number }
  /** Un insecte mort rongé laisse une flaque d'acide (« Dissolution » — voir `ELEMENTAIRES`). */
  | { type: 'flaqueDAcide'; x: number; y: number; rayon: number }
  | { type: 'feuPropage'; de: number; vers: number; x0: number; y0: number; x1: number; y1: number }
  /** Une boule tesla se charge d'un coup critique (« Accumulateur » — voir `Arme.sphere.accumulateur`). */
  | { type: 'sphereChargee'; x: number; y: number; charge: number }
  /** Un coup électrique sur un insecte déjà électrocuté : il tire sa chance de faire sauter un arc (voir `propagerLElectrocution`). */
  | { type: 'coupElectrique'; id: number; x: number; y: number; jusque: number; chance: number; degats: number; saut: number }
  /** Une nova de givre part du vaisseau (voir `Arme.nova`). */
  | { type: 'nova'; x: number; y: number; rayon: number }
  /** Une bombe part ; une bombe éclate. */
  | { type: 'bombe'; x: number; y: number }
  | { type: 'explosion'; x: number; y: number; rayon: number }
  | { type: 'perdu' }
  /** L'invasion : une vague commence ; un insecte traverse le portail. */
  | { type: 'vague'; numero: number; nombre: number; cadrans: number[] }
  | { type: 'traverse'; id: number; x: number; y: number }
  /** L'invasion : un niveau gagné ; le joueur abattu revient au portail. */
  | { type: 'niveau'; niveau: number }
  | { type: 'retour' }
  /** L'explosion de lumière du retour (voir `invasion.retour`) : là où il revient, et sur quel rayon. */
  | { type: 'deflagration'; x: number; y: number; rayon: number }
  /** L'invasion : le portail est tombé, la partie est finie. */
  | { type: 'fin'; vague: number }

export function nouveauVaisseau(): Vaisseau {
  return { x: 0, y: 0, vx: 0, vy: 0, cap: -Math.PI / 2, poussee: 0, parcouru: 0, contact: null }
}

export function nouveauMonde(c: ConfigVaisseau = VAISSEAU, graine = 1): Monde {
  return { t: 0, phase: 'vol', vaisseau: nouveauVaisseau(), coque: c.coque, coqueMax: c.coque, tableau: tableauVide(), bouclier: c.bouclier.points, plaques: Array.from({ length: c.plaques }, () => true), intouchableJusque: -1, corruption: 0, dephaseJusque: -100, plaqueCasseeA: 0, renaitJusque: -100, rochesPrises: [], toucheA: -100, forage: null, forages: [], ennemis: [], prochainEnnemiA: c.ennemi.apparait, prochaineDeriveA: c.derive.premier, invasion: { vague: 0, aNaitre: 0, prochainA: c.invasion.premiere, passes: 0, abattus: 0, xp: 0, niveau: 1, retourA: 0, vie: c.invasion.viePortail, vies: c.invasion.vies, miniBoss: 0, boss: 0, finie: false, cadrans: [], nes: 0 }, tirs: [], obus: [], armesA: [], creuse: new Map(), fore: new Map(), detruits: new Set(), pepites: [], minerai: 0, banque: 0, cargaison: cargaisonVide(), refuses: { fer: false, or: false, cristal: false }, tresor: cargaisonVide(), extraction: 0, sorti: false, boostA: -1000, bombes: [], charges: c.bombe.charges, prochainId: 1, graine: graine >>> 0 || 1, verrou: null, crache: false, drones: [], tourelles: [], flaques: [], balayage: null, canal: null, harpons: [], rafales: [], rafaleDesAiles: 0, salveDesAiles: -1e9, faisceaux: [], sillons: [], balisesLaser: [], scies: [], balises: [], givres: [], tornades: [], novas: [], echardes: [], spheres: [], puits: [], meteores: [], tentacules: [], nuees: [], rejetons: [], flaquesAcides: [], mines: [], fleaux: [], parasites: [], vrilles: [], liens: [], oeufs: [], brochettes: [], miniVers: [], hypercubes: [], des: [], coupes: [], rayonVu: null }
}

/** Un hachage entier déterministe (celui de pixelfx), et un réel dans [0, 1) qui en sort. */
export function hache(...ns: number[]): number {
  let h = 0x9e3779b9
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b)
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35)
    h ^= h >>> 16
  }
  return h >>> 0
}
export const tire = (...ns: number[]): number => hache(...ns) / 4294967296

/** (Le `tire` du module, sous un autre nom : `asteroideDeLaCase` le masque par sa version à graine.) */
const tirer = (...v: number[]): number => tire(...v)

/** L'astéroïde de la case (i, j), ou `null` si elle est vide : le même à chaque appel, pour une graine du champ donnée. */
export function asteroideDeLaCase(c: ConfigVaisseau, i: number, j: number): Asteroide | null {
  // (la graine du champ entre dans chaque tirage ; à zéro, les tirages de toujours)
  const g = c.champ.graine
  const tire = (a: number, b: number, k: number): number => (g === 0 ? tirer(a, b, k) : tirer(a, b, k, g))
  if (tire(i, j, 1) >= c.champ.densite) return null
  const taille = c.champ.case
  const rayon = c.champ.rayonMin + (c.champ.rayonMax - c.champ.rayonMin) * tire(i, j, 2) ** 1.6
  const x = (i + 0.2 + 0.6 * tire(i, j, 3)) * taille
  const y = (j + 0.2 + 0.6 * tire(i, j, 4)) * taille
  // le vide autour de chaque station (le parvis)
  const st = stationLaPlusProche(c, x, y)
  if (Math.hypot(x - st.x, y - st.y) < (st.x === 0 && st.y === 0 ? c.base.rayon : c.champ.vide) + rayon) return null
  // le filon : l'or et le cristal plus fréquents loin du départ ; la richesse biaisée vers les pauvres
  const loin = Math.min(1, Math.hypot(x, y) / c.filons.horizon)
  const pc = c.filons.cristalPres + (c.filons.cristalLoin - c.filons.cristalPres) * loin
  const po = c.filons.orPres + (c.filons.orLoin - c.filons.orPres) * loin
  const u = tire(i, j, 8)
  const minerai: Minerai = u < pc ? 'cristal' : u < pc + po ? 'or' : 'fer'
  const richesse = 0.25 + 0.75 * tire(i, j, 9) ** 1.4
  return { id: hache(i, j), x, y, rayon, graine: g === 0 ? hache(i, j, 5) : hache(i, j, 5, g), angle0: tire(i, j, 6) * Math.PI * 2, vitesseAngulaire: (tire(i, j, 7) - 0.5) * 1.2, minerai, richesse }
}

/**
 * LES STATIONS : une par case de `station.case` unités, les cases centrées sur les multiples (la case (i, j) va de
 * (i − ½) à (i + ½)) ; celle de (0, 0) est au point de départ, les autres à ±0,2 case de leur centre d'après leurs
 * coordonnées hachées. Rien n'est stocké : on retrouve la même station en revenant.
 */
export function stationDeLaCase(c: ConfigVaisseau, i: number, j: number): Vecteur {
  if (i === 0 && j === 0) return { x: 0, y: 0 }
  const taille = c.station.case
  return { x: (i + (tire(i, j, 81) - 0.5) * 0.4) * taille, y: (j + (tire(i, j, 82) - 0.5) * 0.4) * taille }
}

/** La station la plus proche de (x, y), parmi celles des neuf cases autour (une station ne sort jamais de sa case). */
export function stationLaPlusProche(c: ConfigVaisseau, x: number, y: number): Vecteur {
  if (c.station.seule) return { x: 0, y: 0 }
  const i0 = Math.round(x / c.station.case)
  const j0 = Math.round(y / c.station.case)
  let meilleure: Vecteur = { x: 0, y: 0 }
  let dmin = Infinity
  for (let j = j0 - 1; j <= j0 + 1; j++)
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      const st = stationDeLaCase(c, i, j)
      const d = Math.hypot(st.x - x, st.y - y)
      if (d < dmin) (dmin = d), (meilleure = st)
    }
  return meilleure
}

/** Les astéroïdes dont la case touche le carré de demi-côté `portee` autour de (x, y). */
export function asteroidesAutour(c: ConfigVaisseau, x: number, y: number, portee: number): Asteroide[] {
  const taille = c.champ.case
  const i0 = Math.floor((x - portee) / taille)
  const i1 = Math.floor((x + portee) / taille)
  const j0 = Math.floor((y - portee) / taille)
  const j1 = Math.floor((y + portee) / taille)
  const liste: Asteroide[] = []
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const a = asteroideDeLaCase(c, i, j)
      if (a !== null) liste.push(a)
    }
  return liste
}

/** Les astéroïdes autour de (x, y) qui tiennent encore. */
export function asteroidesVisibles(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): Asteroide[] {
  return asteroidesAutour(c, x, y, portee).filter((a) => !m.detruits.has(a.id))
}

/** Les points qu'une roche peut encaisser avant d'éclater. */
export const solidite = (c: ConfigVaisseau, a: Asteroide): number => c.forage.durete * a.rayon * a.rayon

/** L'écart d'angle le plus court de `de` vers `vers`, dans [−π, π]. */
const ecartDAngle = (de: number, vers: number): number => Math.atan2(Math.sin(vers - de), Math.cos(vers - de))

type Moteur = { poussee: number; vitesseMax: number; rotation: number; rayon: number; /** Il traverse les roches (le joueur déphasé — voir `dephasage`). */ fantome?: boolean; /** Sa masse, s'il peut traverser les roches légères (le joueur ; le rival n'en a pas). */ masse?: number; /** Son virage (voir `ConfigVaisseau.virage`) : le joueur seul. */ virage?: number }

/**
 * Fait voler un corps de `dt` secondes sous une direction (longueur 0 à 1) : la poussée, le frein du vide, le plafond,
 * le nez qui se tourne, puis les chocs contre les astéroïdes — sauf ceux de `detruits`, qui ne sont plus là (Keko :
 * « quand je détruis un astéroïde je collisionne toujours avec son ancienne position »). Rend le corps neuf et les chocs.
 */
export function voler(c: ConfigVaisseau, moteur: Moteur, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set(), regard?: Vecteur): { vaisseau: Vaisseau; chocs: Choc[] } {
  const n = Math.hypot(direction.x, direction.y)
  const force = Math.min(1, n)
  // (pousser à l'opposé du nez pousse moins — que le nez soit tenu par un regard ou qu'il n'ait pas encore tourné)
  const derriere = n > 0 ? Math.max(0, -((direction.x / n) * Math.cos(v.cap) + (direction.y / n) * Math.sin(v.cap))) : 0
  const part = 1 - (1 - c.marcheArriere) * derriere
  let vx = v.vx + (n > 0 ? (direction.x / n) * force * part * moteur.poussee * dt : 0)
  let vy = v.vy + (n > 0 ? (direction.y / n) * force * part * moteur.poussee * dt : 0)
  // LE FREIN DU VIDE NE S'OPPOSE PLUS À LA POUSSÉE (Keko, 13/11 : « très chiant que l'accélération basse entraîne une
  // incapacité d'atteindre la vitesse max — il ne faudrait jamais que ça arrive »). Le frein étant proportionnel à la
  // vitesse, une petite poussée s'équilibrait avec lui bien avant la pointe : la pointe n'était qu'un plafond rarement
  // atteint. Désormais il ne freine que CE QUI N'EST PAS POUSSÉ : la part de la vitesse qui va dans le sens du manche
  // lui échappe (à proportion de la force du manche), le reste — la dérive de côté, l'élan contraire — freine comme
  // avant. Manche lâché, tout freine. Ainsi LA POINTE EST TOUJOURS ATTEINTE, et l'accélération dit en combien de temps.
  const frein = Math.exp(-c.frein * dt)
  if (n > 0) {
    const ux = direction.x / n
    const uy = direction.y / n
    const pousse = Math.max(0, vx * ux + vy * uy)
    const garde = pousse * (force + (1 - force) * frein)
    vx = (vx - pousse * ux) * frein + garde * ux
    vy = (vy - pousse * uy) * frein + garde * uy
  } else {
    vx *= frein
    vy *= frein
  }
  // (LE VIRAGE : la vitesse plie vers le manche, sans perdre son élan, d'autant plus vite qu'on pousse fort)
  const vir = moteur.virage ?? 0
  if (vir > 0 && n > 0.05) {
    const sp = Math.hypot(vx, vy)
    if (sp > 1) {
      const a = Math.atan2(vy, vx)
      const e = ecartDAngle(a, Math.atan2(direction.y, direction.x))
      const r = a + Math.sign(e) * Math.min(Math.abs(e), vir * force * dt)
      vx = Math.cos(r) * sp
      vy = Math.sin(r) * sp
    }
  }
  const vitesse = Math.hypot(vx, vy)
  if (vitesse > moteur.vitesseMax) {
    vx *= moteur.vitesseMax / vitesse
    vy *= moteur.vitesseMax / vitesse
  }
  // le nez : vers le manche quand on pousse, sinon vers où l'on glisse (s'il y a une vitesse à suivre) — SAUF SI ON
  // REGARDE AILLEURS (Keko, 12/11 : un second doigt « prend le pas sur l'orientation » : on avance d'un côté, on
  // regarde de l'autre) : `regard`, s'il est donné et franc, dit où va le nez ; la poussée, elle, suit toujours le manche
  let cap = v.cap
  const regarde = regard !== undefined && Math.hypot(regard.x, regard.y) > 0.05
  const voulu = regarde ? Math.atan2(regard.y, regard.x) : n > 0.05 ? Math.atan2(direction.y, direction.x) : vitesse > 6 ? Math.atan2(vy, vx) : cap
  const ecart = ecartDAngle(cap, voulu)
  if (!c.omni) cap += Math.sign(ecart) * Math.min(Math.abs(ecart), moteur.rotation * dt)
  let x = v.x + vx * dt
  let y = v.y + vy * dt
  // les chocs : repoussé hors de l'astéroïde, la vitesse normale rendue en partie ; un choc n'est rapporté que s'il
  // est franc (au-dessus du seuil) et nouveau (on ne touchait pas déjà cette roche)
  const chocs: Choc[] = []
  let contact: number | null = null
  for (const a of moteur.fantome === true ? [] : asteroidesAutour(c, x, y, c.champ.rayonMax + moteur.rayon + 2)) {
    if (detruits.has(a.id)) continue
    const dx = x - a.x
    const dy = y - a.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = a.rayon + moteur.rayon
    if (d >= minimum) continue
    const nx = dx / d
    const ny = dy / d
    const vn = vx * nx + vy * ny
    // (UNE ROCHE TROP LÉGÈRE pour ce vaisseau, heurtée franchement : il la traverse — ni repoussé, ni renvoyé —, ralenti
    // de la part qu'elle pèse ; c'est l'appelant qui la brise)
    const q = moteur.masse === undefined ? Infinity : (c.collision.masseRoche * a.rayon * a.rayon) / moteur.masse
    if (q < c.collision.perce && -vn >= c.seuilChoc) {
      vx *= 1 - q
      vy *= 1 - q
      chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id, perce: q })
      continue
    }
    x = a.x + nx * minimum
    y = a.y + ny * minimum
    if (vn < 0) {
      vx -= (1 + c.rebond) * vn * nx
      vy -= (1 + c.rebond) * vn * ny
      if (-vn >= c.seuilChoc && v.contact !== a.id) chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id })
    }
    contact = a.id
  }
  return { vaisseau: { x, y, vx, vy, cap, poussee: force, parcouru: v.parcouru + vitesse * dt, contact }, chocs }
}

/** Le vaisseau du joueur avance (le moteur du joueur). */
export function avancer(c: ConfigVaisseau, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set()): { vaisseau: Vaisseau; chocs: Choc[] } {
  return voler(c, c, v, dt, direction, detruits)
}

/** La roche la plus proche (de sa surface) de (x, y), à `portee` au plus ; `null` sinon. */
function rocheLaPlusProche(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): { roche: Asteroide; d: number } | null {
  let meilleure: { roche: Asteroide; d: number } | null = null
  for (const a of asteroidesVisibles(c, m, x, y, portee + c.champ.rayonMax)) {
    const d = Math.hypot(a.x - x, a.y - y) - a.rayon
    if (d <= portee && (meilleure === null || d < meilleure.d)) meilleure = { roche: a, d }
  }
  return meilleure
}

/** Un laser creuse une roche de `points` : elle éclate si elle n'en peut plus (ses pépites naissent), sinon le forage est rendu. */
function creuserLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, depuis: Vecteur, points: number, ev: Evenement[], double = 0): Forage | null {
  const dx = a.x - depuis.x
  const dy = a.y - depuis.y
  const d = Math.hypot(dx, dy) || 1
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  const total = solidite(c, a)
  m.fore.set(a.id, (m.fore.get(a.id) ?? 0) + points)
  if (creuse < total) {
    m.creuse.set(a.id, creuse)
    return { sorte: 'roche', cible: a.id, x: a.x - (dx / d) * a.rayon, y: a.y - (dy / d) * a.rayon, part: creuse / total }
  }
  eclaterLaRoche(c, m, a, ev, double)
  return null
}

/** La roche éclate : elle quitte le monde et laisse ses pépites — chacune a `double` chances de naître deux fois (le filon double du labo, pour le laser du joueur seul). */
function eclaterLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, ev: Evenement[], double = 0): void {
  // (LA PART CREUSÉE À LA FOREUSE : c'est elle qui rend des pépites — entière si le laser a tout fait, nulle s'il n'y a pas touché)
  const part = Math.min(1, (m.fore.get(a.id) ?? 0) / solidite(c, a))
  m.creuse.delete(a.id)
  m.fore.delete(a.id)
  m.detruits.add(a.id)
  ev.push({ type: 'eclat', x: a.x, y: a.y, rayon: a.rayon, graine: a.graine, minerai: a.minerai })
  // tant de pépites de son minerai : selon sa taille ET sa richesse (une pauvre en rend le tiers d'une riche), fois la part forée
  const n = part >= 1 ? Math.max(1, Math.round(a.rayon * c.forage.pepitesParRayon * (0.4 + 1.2 * a.richesse))) : Math.round(Math.max(1, a.rayon * c.forage.pepitesParRayon * (0.4 + 1.2 * a.richesse)) * part)
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(a.graine, 20, i) * 1.2
    const vit = 20 + 40 * tire(a.graine, 21, i)
    m.pepites.push({ id: m.prochainId++, x: a.x + Math.cos(an) * a.rayon * 0.5, y: a.y + Math.sin(an) * a.rayon * 0.5, vx: Math.cos(an) * vit, vy: Math.sin(an) * vit, graine: hache(a.graine, i), minerai: a.minerai })
    if (double > 0 && tire(a.graine, 22, i) < double) {
      const an2 = an + 0.5
      m.pepites.push({ id: m.prochainId++, x: a.x + Math.cos(an2) * a.rayon * 0.5, y: a.y + Math.sin(an2) * a.rayon * 0.5, vx: Math.cos(an2) * vit * 0.8, vy: Math.sin(an2) * vit * 0.8, graine: hache(a.graine, i, 7), minerai: a.minerai })
    }
  }
}

/** Un choc abîme la roche heurtée de tant de points ; elle éclate si elle n'en peut plus. */
function abimerLaRoche(c: ConfigVaisseau, m: Monde, choc: Choc, points: number, ev: Evenement[]): void {
  if (points <= 0) return
  const a = asteroidesVisibles(c, m, choc.x, choc.y, c.champ.rayonMax + 2).find((r) => r.id === choc.asteroide)
  if (a === undefined) return
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  if (creuse >= solidite(c, a)) eclaterLaRoche(c, m, a, ev)
  else m.creuse.set(a.id, creuse)
}

/** Les points qu'un choc coûte, par unité de vitesse au-delà du seuil. */
const coutDuChoc = (c: ConfigVaisseau, choc: Choc, parUnite: number): number => Math.max(0, choc.force - c.seuilChoc) * parUnite

/**
 * LARGUER (Keko, 11/11 : « je remplis ma soute avec du fer involontairement (l'aimant) et quand j'arrive au cristal je
 * n'ai pas la place » — « permettre l'accès à la soute via un bouton, avec la possibilité de larguer des loots ; ils sont
 * alors détruits ») : tant de pépites de ce minerai quittent la soute et ne vont nulle part (ni pépites libres, ni
 * trésor). Rend combien sont vraiment parties (pas plus qu'on n'en porte).
 */
export function larguer(m: Monde, minerai: Minerai, combien: number): number {
  const n = Math.max(0, Math.min(Math.floor(combien), m.cargaison[minerai]))
  m.cargaison[minerai] -= n
  m.minerai -= n
  return n
}

/** L'ennemi est abattu : il quitte le monde, le suivant est annoncé, il rend son butin et des pépites. */
/** LA PURGE (les Innommés) : un insecte abattu en (x, y) rend saine une part de la corruption — voir la configuration. */
export function purger(c: ConfigVaisseau, m: Monde, x: number, y: number, ev: Evenement[]): void {
  if (c.corruption.purge <= 0 || m.corruption <= 0 || m.phase !== 'vol') return
  m.corruption = Math.max(0, m.corruption - c.corruption.purge)
  ev.push({ type: 'purge', x, y })
}
/** (`sansButin` : il meurt sans rien lâcher — dans la tempête, voir `conduireLInsecte` ; et il ne compte pas comme abattu) */
function abattreLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, ev: Evenement[], sansButin = false): void {
  // (DÉJÀ PARTI, il ne meurt pas deux fois : mort dans la tempête, un coup de la même image le retrouvait à zéro et lui
  // faisait lâcher son butin — mesuré)
  if (!m.ennemis.includes(e)) return
  m.ennemis = m.ennemis.filter((x) => x !== e)
  m.prochainEnnemiA = m.t + c.ennemi.revient
  const ro = e.asteroide
  if (c.invasion.active && ro === undefined && !sansButin) m.invasion.abattus += 1
  // (« DISSOLUTION » : mort rongé, il laisse une flaque d'acide à sa taille — voir `ELEMENTAIRES` ; elle n'est à aucune arme)
  if (ro === undefined && !sansButin && c.elementaires.dissolution && e.acide !== undefined && e.acide.jusque > m.t) {
    const D = ELEMENTAIRES.dissolution
    m.givres.push({ id: m.prochainId++, arme: -1, x: e.corps.x, y: e.corps.y, nee: m.t, rayon: rayonDe(c, e) * D.taille, duree: D.duree, dps: D.dps * (1 + c.renforts.corrosion), ralenti: 1, poison: true, corrosion: { duree: D.duree, bonus: e.acide.bonus } })
    ev.push({ type: 'flaqueDAcide', x: e.corps.x, y: e.corps.y, rayon: rayonDe(c, e) * D.taille })
  }
  // (« COMBUSTION » : mort en feu, il explose — voir `ELEMENTAIRES` ; ce qu'elle tue en feu explose à son tour)
  if (ro === undefined && !sansButin && c.elementaires.combustion && (e.bruleA ?? -1) > m.t) {
    const B = ELEMENTAIRES.combustion
    const r = rayonDe(c, e) * B.taille
    ev.push({ type: 'explosionDeZone', x: e.corps.x, y: e.corps.y, rayon: r })
    for (const o of [...m.ennemis]) {
      if (o.asteroide !== undefined || Math.hypot(o.corps.x - e.corps.x, o.corps.y - e.corps.y) > r + rayonDe(c, o)) continue
      o.pv -= B.degats * (1 + c.renforts.feu)
      ev.push({ type: 'ennemiTouche', id: o.id, x: o.corps.x, y: o.corps.y, critique: false })
      if (o.pv <= 0) abattreLEnnemi(c, m, o, ev)
    }
  }
  // (LE TABLEAU : au pilote dont c'est le tour — celui qui porte le coup fatal ; les grands, à l'équipe — voir `invasion.points`)
  if (c.invasion.active && !sansButin) {
    if (ro !== undefined) m.tableau = { ...m.tableau, roches: m.tableau.roches + 1, pointsDeRoches: m.tableau.pointsDeRoches + pointsDeLaRoche(c, ro.rayon) }
    else if (e.grand === true) {
      if (e.boss === true) m.invasion.boss += 1
      else m.invasion.miniBoss += 1
    } else m.tableau = { ...m.tableau, insectes: m.tableau.insectes + 1, points: m.tableau.points + pointsDeLInsecte(c, e) }
  }
  purger(c, m, e.corps.x, e.corps.y, ev)
  // (UNE ROCHE QUI DÉRIVE éclate comme une roche, et rend ses pépites — voir `derive`)
  if (ro !== undefined) ev.push({ type: 'eclat', x: e.corps.x, y: e.corps.y, rayon: ro.rayon, graine: ro.graine, minerai: 'fer' })
  else ev.push({ type: 'ennemiDetruit', id: e.id, x: e.corps.x, y: e.corps.y, vx: e.corps.vx, vy: e.corps.vy, brule: (e.bruleA ?? -1) > m.t, gele: (e.bruleA ?? -1) <= m.t && (e.geleA ?? -1) > m.t })
  // il rend sa cargaison, minerai par minerai, plus tant de pépites de fer
  const rendues: Minerai[] = []
  for (const k of MINERAIS) for (let i = 0; i < e.cargaison[k]; i++) rendues.push(k)
  if (sansButin) return
  const total = ro !== undefined ? butinDeLaRoche(c, ro.pvMax) : butinDe(c, e)
  // (AU VORTEX, LE BUTIN EN GEMMES — voir `invasion.gemmes` ; et l'aimant, rarement — voir `invasion.aimant`)
  const valeurs: number[] = []
  if (c.invasion.active) for (const v of gemmesDuButin(c, total)) (rendues.push('fer'), valeurs.push(v))
  else for (let i = 0; i < total; i++) rendues.push('fer')
  const aimant = c.invasion.active && ro === undefined && tire(e.id, 35) < c.invasion.aimant
  if (aimant) (rendues.push('fer'), valeurs.push(0))
  // (UN INSECTE, SOUS LES ARMES D'UN VAISSEAU À PLAQUES : peut-être une plaque — voir `invasion.plaque`)
  if (c.invasion.active && ro === undefined && c.plaques > 0 && tire(e.id, 37) < chanceDePlaque(c, e)) (rendues.push('fer'), valeurs.push(-1))
  // (UN INSECTE : peut-être un soin — voir `invasion.soin`)
  if (c.invasion.active && ro === undefined && tire(e.id, 38) < c.invasion.soin.chance) (rendues.push('fer'), valeurs.push(-2))
  const n = rendues.length
  const dec = n - valeurs.length
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(e.id, 30, i)
    const vit = 20 + 40 * tire(e.id, 31, i)
    const val = i >= dec ? valeurs[i - dec] : undefined
    m.pepites.push({ id: m.prochainId++, x: e.corps.x, y: e.corps.y, vx: Math.cos(an) * vit + e.corps.vx * 0.3, vy: Math.sin(an) * vit + e.corps.vy * 0.3, graine: hache(e.id, i), minerai: rendues[i], ...(val === undefined ? {} : val === 0 ? { aimant: true, valeur: 0 } : val === -1 ? { plaque: true, valeur: 0 } : val === -2 ? { soin: true, valeur: 0 } : { valeur: val }) })
  }
}

/** Le tableau d'un pilote (voir `Monde.tableau`). */
export type Tableau = { insectes: number; points: number; roches: number; pointsDeRoches: number }
export const tableauVide = (): Tableau => ({ insectes: 0, points: 0, roches: 0, pointsDeRoches: 0 })
/** Les points d'un insecte abattu (voir `invasion.points`). */
export const pointsDeLInsecte = (c: ConfigVaisseau, e: Ennemi): number => c.invasion.points[e.sorte ?? 'insecte']
/** Les points d'une roche détruite (voir `invasion.points`) : d'autant plus qu'elle est grosse. */
export const pointsDeLaRoche = (c: ConfigVaisseau, rayon: number): number => Math.max(c.invasion.points.rocheMin, Math.round(rayon * c.invasion.points.roche))
/**
 * LA RÉCOMPENSE DE FIN DE PARTIE (voir `invasion.recompense`) : ce que gagne un pilote, ligne par ligne — le niveau
 * (commun), ses insectes et ses roches (à lui), les mini-boss et les boss (à l'équipe) — et le total, en crédits
 * entiers. Pas de prime : une partie vide ne vaut que son niveau.
 */
export type LigneDeRecompense = { quoi: 'niveau' | 'insectes' | 'roches' | 'miniBoss' | 'boss'; nombre: number; credits: number }
export function recompenseDeFin(c: ConfigVaisseau, niveau: number, tableau: Tableau, equipe: { miniBoss: number; boss: number }): { lignes: LigneDeRecompense[]; total: number } {
  const R = c.invasion.recompense
  const n = Math.max(0, niveau - 1)
  const lignes: LigneDeRecompense[] = [
    { quoi: 'niveau', nombre: niveau, credits: Math.round(R.parNiveau * niveau + R.carreNiveau * n * n) },
    { quoi: 'insectes', nombre: tableau.insectes, credits: Math.round(tableau.points * R.parPoint) },
    { quoi: 'roches', nombre: tableau.roches, credits: Math.round(tableau.pointsDeRoches * R.parPointDeRoche) },
    { quoi: 'miniBoss', nombre: equipe.miniBoss, credits: equipe.miniBoss * R.miniBoss },
    { quoi: 'boss', nombre: equipe.boss, credits: equipe.boss * R.boss },
  ]
  return { lignes, total: lignes.reduce((s, l) => s + l.credits, 0) }
}

/** La chance qu'un insecte abattu fasse tomber une plaque (voir `invasion.plaque`, `recuperation`) : d'autant plus qu'il est dur. */
export function chanceDePlaque(c: ConfigVaisseau, e: Ennemi): number {
  return Math.min(1, c.invasion.plaque * (e.sorte === undefined ? 1 : c.invasion[e.sorte].vie) * c.recuperation)
}

/** L'ennemi naît au loin, dans une direction tirée de la graine du monde, et regarde le joueur. */
function faireNaitreUnEnnemi(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  // (au large de la base : dans le demi-plan opposé à elle, à ±70° — jamais entre le joueur et sa station)
  let a = c.base.calme > 0 ? Math.atan2(v.y, v.x) + (tire(m.graine, m.prochainId, 3) - 0.5) * 2.4 : tire(m.graine, m.prochainId, 3) * Math.PI * 2
  m.graine = hache(m.graine, 7)
  let x = v.x + Math.cos(a) * c.ennemi.distance
  let y = v.y + Math.sin(a) * c.ennemi.distance
  // pas dans une roche : on tourne autour du joueur jusqu'à un coin libre
  for (let essai = 0; essai < 12; essai++) {
    const libre = asteroidesVisibles(c, m, x, y, c.champ.rayonMax + 20).every((r) => Math.hypot(r.x - x, r.y - y) > r.rayon + c.ennemi.rayon + 12)
    if (libre) break
    a += Math.PI / 6
    x = v.x + Math.cos(a) * c.ennemi.distance
    y = v.y + Math.sin(a) * c.ennemi.distance
  }
  const e: Ennemi = { id: m.prochainId++, corps: { ...nouveauVaisseau(), x, y, cap: Math.atan2(v.y - y, v.x - x) }, pv: c.ennemi.pv, fait: 'mine', roche: null, forage: null, tirA: m.t + c.ennemi.cadence, butin: 0, cargaison: cargaisonVide() }
  m.ennemis.push(e)
  ev.push({ type: 'ennemiApparait', id: e.id, x, y })
}

/**
 * LE RAYON D'UN ENNEMI, pour qu'on le touche : celui des insectes (`ennemi.rayon`), ou celui de la roche qui dérive —
 * toute sa surface se touche, pas seulement son cœur (Keko, 20/11 : des roches plus grosses, jusqu'à 34).
 */
export const rayonDe = (c: ConfigVaisseau, e: Ennemi): number => e.asteroide?.rayon ?? c.ennemi.rayon * (e.sorte === undefined ? 1 : c.invasion[e.sorte].taille)
/** Les sortes d'insectes autres que le petit : le moucheron (le menu fretin), le cornu (milieu de gamme), le cuirassier (blindé). */
export type SorteDInsecte = 'moucheron' | 'cornu' | 'cuirassier'
export const SORTES_D_INSECTES: SorteDInsecte[] = ['moucheron', 'cornu', 'cuirassier']
/** Un butin de `total` points en gemmes (voir `invasion.gemmes`) : les plus grosses d'abord. */
export function gemmesDuButin(c: ConfigVaisseau, total: number): number[] {
  const g: number[] = []
  let reste = Math.max(0, Math.round(total))
  for (const v of c.invasion.gemmes)
    while (reste >= v) {
      g.push(v)
      reste -= v
    }
  return g
}
/** Ce qu'une roche qui dérive rend, en points (voir `derive.pepitesParPv`). */
export const butinDeLaRoche = (c: ConfigVaisseau, pvMax: number): number => Math.max(1, Math.round(pvMax * c.derive.pepitesParPv))
/** Ce qu'un insecte rend de pépites : son butin, et sa part fractionnaire tirée de son identité (le moucheron : une fois sur deux). */
function butinDe(c: ConfigVaisseau, e: Ennemi): number {
  const b = gabaritDInsecte(c, e).butin
  return Math.floor(b) + (tire(e.id, 33) < b - Math.floor(b) ? 1 : 0)
}
/** Le gabarit d'un insecte : ses facteurs de vie, de taille, de vitesse, de morsure, et son butin (un petit : 1, et `butinRendu`). */
export function gabaritDInsecte(c: ConfigVaisseau, e: Ennemi): { vie: number; taille: number; vitesse: number; morsure: number; butin: number } {
  return e.sorte === undefined ? { vie: 1, taille: 1, vitesse: 1, morsure: 1, butin: c.ennemi.butinRendu } : c.invasion[e.sorte]
}

/**
 * UNE ROCHE DE LA TEMPÊTE (voir `arene`) : la k-ième, à l'instant `t` — tirée de son rang, rien n'est gardé. ELLE NE
 * TOURNE PAS SUR ELLE-MÊME (Keko, 21/11 : « pas obligé de faire tourner les astéroïdes dans le vortex ») : elle tourne
 * autour du centre, c'est tout — et la page n'en garde qu'une image.
 */
// (… ET ELLE TOURNE D'UN BLOC — Keko, 21/11 : « des astéroïdes se superposent alors qu'ils ne devraient pas » : chacune
// tournait à sa vitesse, elles se dépassaient et se traversaient. TOUTES TOURNENT À LA MÊME VITESSE ANGULAIRE
// (`vitesseDeLaTempete` : `arene.vitesse` le long du milieu de l'anneau), et elles sont PLACÉES UNE FOIS SANS SE
// RECOUVRIR (`placementDeLaTempete`) : elles ne se rencontrent jamais)
export function rocheDeLaTempete(c: ConfigVaisseau, k: number, t: number): { x: number; y: number; vx: number; vy: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number } {
  const pl = placementDeLaTempete(c)[k]
  const w = vitesseDeLaTempete(c)
  const a = pl.a0 + w * t
  return { x: Math.cos(a) * pl.r, y: Math.sin(a) * pl.r, vx: -Math.sin(a) * w * pl.r, vy: Math.cos(a) * w * pl.r, rayon: pl.rayon, graine: hache(7, k), angle0: tire(7, k, 5) * 6.28, vitesseAngulaire: 0 }
}
/** La vitesse angulaire de la tempête, la même pour toutes ses roches (voir `rocheDeLaTempete`). */
export const vitesseDeLaTempete = (c: ConfigVaisseau): number => c.arene.vitesse / (c.arene.rayon + c.arene.largeur / 2)
/**
 * OÙ SONT LES ROCHES DE LA TEMPÊTE À L'INSTANT ZÉRO : la k-ième, son rayon et son angle tirés de son rang — et, si elle
 * recouvre une de celles d'avant, retirés (quarante fois au plus) jusqu'à ce qu'elle ne recouvre plus rien. Calculé une
 * fois par réglage de l'arène, gardé.
 */
const placements = new Map<string, { r: number; a0: number; rayon: number }[]>()
function placementDeLaTempete(c: ConfigVaisseau): { r: number; a0: number; rayon: number }[] {
  const A = c.arene
  const cle = `${A.rayon}:${A.largeur}:${A.roches}:${A.rocheMin}:${A.rocheMax}`
  const deja = placements.get(cle)
  if (deja !== undefined) return deja
  const l: { r: number; a0: number; rayon: number }[] = []
  for (let k = 0; k < A.roches; k++) {
    const rayon = A.rocheMin + (A.rocheMax - A.rocheMin) * tire(7, k, 4) ** 1.5
    let pl = { r: 0, a0: 0, rayon }
    for (let essai = 0; essai < 40; essai++) {
      const r = A.rayon + A.largeur * (0.15 + 0.7 * tire(7, k, 1, essai))
      const a0 = ((k + tire(7, k, 3, essai) * 0.8) / A.roches) * Math.PI * 2
      pl = { r, a0, rayon }
      if (l.every((q) => Math.hypot(Math.cos(a0) * r - Math.cos(q.a0) * q.r, Math.sin(a0) * r - Math.sin(q.a0) * q.r) >= rayon + q.rayon + 2)) break
    }
    l.push(pl)
  }
  placements.set(cle, l)
  return l
}

/**
 * UN COUP DE LA TEMPÊTE — son énergie, ses roches (Keko, 21/11 : « on attaque directement le blindage ; on ignore les
 * boucliers bleus, les plaques de blindage ; on ne peut pas déclencher de déphasage ») : les `degats` passent au blindage
 * tout droit, sans `encaisser` — ni bouclier, ni plaque, ni corruption, ni déphasage, ni invincibilité ; percé, le vaisseau
 * est perdu. `signal` : le coup se montre (une roche) ; l'énergie, qui ronge à chaque pas, se tait.
 */
function blesserParLaTempete(c: ConfigVaisseau, m: Monde, x: number, y: number, degats: number, ev: Evenement[], signal: boolean): void {
  m.coque -= degats
  m.corruption = Math.min(m.corruption, Math.max(0, m.coque))
  if (signal) ev.push({ type: 'touche', x, y })
  if (m.coque <= 1e-9) {
    m.coque = 0
    m.phase = 'perdu'
    if (c.invasion.active) m.invasion.retourA = m.t + c.invasion.penalite
    ev.push({ type: 'perdu' })
  }
}

/** UN POINT DE NAISSANCE DANS L'ARÈNE (voir `arene`) : à `d` du vaisseau dans la direction `a` — tourné, ou ramené, s'il tombait dans la tempête. */
// (`centre` : d'où compter — à plusieurs, le pilote pour qui il naît, ou celui qu'il chasse ; par défaut le milieu de
// l'équipage, seul le vaisseau)
function dansLArene(c: ConfigVaisseau, m: Monde, a: number, d: number, centre: Vecteur = centreDeLEquipage(m)): Vecteur {
  const v = centre
  const limite = c.arene.rayon - c.arene.marge
  for (let essai = 0; essai < 12; essai++) {
    const an = a + (essai % 2 === 0 ? 1 : -1) * Math.ceil(essai / 2) * 0.5
    const p = { x: v.x + Math.cos(an) * d, y: v.y + Math.sin(an) * d }
    if (!c.arene.active || Math.hypot(p.x, p.y) <= limite) return p
  }
  const p = { x: v.x + Math.cos(a) * d, y: v.y + Math.sin(a) * d }
  const r = Math.hypot(p.x, p.y) || 1
  return { x: (p.x / r) * limite, y: (p.y / r) * limite }
}

/**
 * L'ARÈNE (voir `arene`) : la tempête ronge le vaisseau qui y est, ses roches le heurtent ; au bord extérieur, le
 * vaisseau et les insectes sont retenus. Rend les chocs (pour l'étincelle) ; le vaisseau perdu, la phase change.
 */
function subirLArene(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[], avant: Vaisseau = m.vaisseau): Choc[] {
  const A = c.arene
  if (!A.active) return []
  const chocs: Choc[] = []
  const v = m.vaisseau
  const butoir = A.rayon + A.largeur
  // (le bord extérieur : on ne va pas plus loin)
  const retenir = (b: Vaisseau): Vaisseau => {
    const r = Math.hypot(b.x, b.y)
    if (r <= butoir) return b
    const nx = b.x / r
    const ny = b.y / r
    const vn = b.vx * nx + b.vy * ny
    return { ...b, x: nx * butoir, y: ny * butoir, vx: b.vx - Math.max(0, vn) * nx, vy: b.vy - Math.max(0, vn) * ny }
  }
  // (LA RETENUE DE LA TEMPÊTE : la vitesse vers l'extérieur plafonnée, d'autant plus bas qu'on s'y enfonce — voir
  // `retenue` ; et LE PAS AUSSI, depuis là où il était avant de voler : plafonner la vitesse seule laissait la poussée
  // de chaque image le faire avancer d'un rien, et en trente secondes il touchait le bord — mesuré)
  const plafondA = (r: number): number => c.vitesseMax * Math.max(0, 1 - (r - A.rayon) / (A.largeur * A.retenue))
  const retenue = (b: Vaisseau): Vaisseau => {
    let r = Math.hypot(b.x, b.y)
    if (r <= A.rayon) return b
    let x = b.x
    let y = b.y
    const r0 = Math.hypot(avant.x, avant.y)
    const permis = Math.max(A.rayon, r0 + plafondA(r0) * dt)
    if (r > permis && r > r0) {
      x = (x / r) * Math.max(r0, permis)
      y = (y / r) * Math.max(r0, permis)
      r = Math.hypot(x, y)
    }
    const nx = x / r
    const ny = y / r
    const vn = b.vx * nx + b.vy * ny
    const plafond = plafondA(r)
    if (vn <= plafond) return { ...b, x, y }
    return { ...b, x, y, vx: b.vx - (vn - plafond) * nx, vy: b.vy - (vn - plafond) * ny }
  }
  m.vaisseau = retenue(retenir(v))
  for (const e of m.ennemis) if (e.asteroide === undefined) e.corps = retenir(e.corps)
  const w = m.vaisseau
  if (Math.hypot(w.x, w.y) <= A.rayon || m.t < m.renaitJusque) return chocs
  // (L'ÉNERGIE RONGE LE BLINDAGE, DIRECTEMENT — Keko, 21/11 : « on attaque directement le blindage ; on ignore les
  // boucliers bleus, les plaques de blindage ; et on ne peut pas déclencher de déphasage aux dégâts de la tempête » :
  // voir `blesserParLaTempete`)
  blesserParLaTempete(c, m, w.x, w.y, A.dps * c.uniteDeVie * dt, ev, false)
  if (m.phase !== 'vol') return chocs
  // (LES ROCHES DE LA TEMPÊTE : celle qui le touche le repousse et l'emporte ; un choc lui coûte `choc` — et celles qu'elle a
  // prises, pareil)
  const wt = vitesseDeLaTempete(c)
  const prises = m.rochesPrises.map((r) => {
    const a = Math.atan2(r.y, r.x)
    const rr = Math.hypot(r.x, r.y)
    return { x: r.x, y: r.y, vx: -Math.sin(a) * wt * rr, vy: Math.cos(a) * wt * rr, rayon: r.rayon }
  })
  for (let k = 0; k < A.roches + prises.length; k++) {
    const r = k < A.roches ? rocheDeLaTempete(c, k, m.t) : prises[k - A.roches]
    const dx = w.x - r.x
    const dy = w.y - r.y
    const d = Math.hypot(dx, dy) || 0.001
    const min = c.rayon + r.rayon
    if (d >= min) continue
    const nx = dx / d
    const ny = dy / d
    const vn = (w.vx - r.vx) * nx + (w.vy - r.vy) * ny
    m.vaisseau = { ...m.vaisseau, x: r.x + nx * min, y: r.y + ny * min, vx: vn < 0 ? m.vaisseau.vx - (1 + c.rebond) * vn * nx : m.vaisseau.vx, vy: vn < 0 ? m.vaisseau.vy - (1 + c.rebond) * vn * ny : m.vaisseau.vy }
    if (vn < -c.seuilChoc) {
      chocs.push({ x: r.x + nx * r.rayon, y: r.y + ny * r.rayon, force: -vn, asteroide: -2 })
      blesserParLaTempete(c, m, r.x + nx * r.rayon, r.y + ny * r.rayon, A.choc * c.uniteDeVie, ev, true)
      if (m.phase !== 'vol') return chocs
    }
  }
  return chocs
}

/** LES ROCHES QUI DÉRIVENT (voir `derive`) : une naît à son heure, tant qu'il y en a moins de `max`. */
function menerLesDerives(c: ConfigVaisseau, m: Monde): void {
  const D = c.derive
  if (!D.active || m.t < m.prochaineDeriveA) return
  const id = m.prochainId++
  m.prochaineDeriveA = m.t + D.tousMin + (D.tousMax - D.tousMin) * tire(m.graine, id, 41)
  if (m.ennemis.filter((e) => e.asteroide !== undefined).length >= D.max) return
  const a = tire(m.graine, id, 42) * Math.PI * 2
  const loin = c.invasion.naissance + D.marge
  // (à plusieurs, autour de l'un d'eux, à tour de rôle)
  const o = m.equipage === undefined ? centreDesRoches(c, m) : pilotePourNaitre(m, id)
  const x = o.x + Math.cos(a) * loin
  const y = o.y + Math.sin(a) * loin
  // (vers un point tiré près du centre du champ — le portail, ou le vaisseau : elle traverse le champ)
  const av = tire(m.graine, id, 43) * Math.PI * 2
  const dv = D.visee * Math.sqrt(tire(m.graine, id, 44))
  const cap = Math.atan2(o.y + Math.sin(av) * dv - y, o.x + Math.cos(av) * dv - x)
  const vit = D.vitesseMin + (D.vitesseMax - D.vitesseMin) * tire(m.graine, id, 45)
  // (une géante, de plus en plus souvent ; sinon une courante — voir `derive.tailles`)
  const Tl = D.tailles
  const partGeante = m.t < Tl.apres ? 0 : Tl.partDebut + (Tl.partFin - Tl.partDebut) * Math.min(1, (m.t - Tl.apres) / Tl.montee)
  const kT = Tl.kDebut + (Tl.k - Tl.kDebut) * Math.min(1, m.t / Tl.montee)
  const rayon = tire(m.graine, id, 49) < partGeante ? Tl.geante + (D.rayonMax - Tl.geante) * tire(m.graine, id, 46) : D.rayonMin + (Tl.courante - D.rayonMin) * tire(m.graine, id, 46) ** kT
  const pv = Math.round(D.pvA10 * (rayon / 10) ** D.exposant)
  m.ennemis.push({ id, corps: { ...nouveauVaisseau(), x, y, vx: Math.cos(cap) * vit, vy: Math.sin(cap) * vit, cap }, pv, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: cargaisonVide(), grand: true, asteroide: { rayon, graine: hache(m.graine, id), angle0: tire(m.graine, id, 47) * Math.PI * 2, vitesseAngulaire: (tire(m.graine, id, 48) - 0.5) * 1.2, pvMax: pv } })
}

/**
 * LE POINT DE RETOUR DU JOUEUR ABATTU (voir `invasion.retour`) : là où est son épave — ramené, s'il est tombé dans la
 * tempête ou trop près d'elle, au point le plus proche à `retour.marge` en deçà de son bord.
 */
export function pointDeRetour(c: ConfigVaisseau, m: Monde): Vecteur {
  const v = m.vaisseau
  if (!c.arene.active) return { x: v.x, y: v.y }
  const limite = c.arene.rayon - c.invasion.retour.marge
  const r = Math.hypot(v.x, v.y)
  return r <= limite ? { x: v.x, y: v.y } : { x: (v.x / r) * limite, y: (v.y / r) * limite }
}

/**
 * LA FIN DE L'INVINCIBILITÉ DU RETOUR (voir `invasion.retour` ; Keko : « attention à ce qu'à la fin, il ne reste pas
 * bloqué à l'intérieur d'un ennemi ») : sorti d'une roche (elle est la plus lourde, c'est lui qui bouge), puis les
 * insectes qui le recouvrent écartés au contact — sans choc ni dégâts.
 */
function degager(c: ConfigVaisseau, m: Monde): void {
  for (const e of m.ennemis) {
    if (e.asteroide === undefined) continue
    const v = m.vaisseau
    const dx = v.x - e.corps.x
    const dy = v.y - e.corps.y
    const d = Math.hypot(dx, dy) || 0.001
    const min = c.rayon + e.asteroide.rayon + 1
    if (d < min) m.vaisseau = { ...v, x: e.corps.x + (dx / d) * min, y: e.corps.y + (dy / d) * min }
  }
  const v = m.vaisseau
  for (const e of m.ennemis) {
    if (e.asteroide !== undefined) continue
    const dx = e.corps.x - v.x
    const dy = e.corps.y - v.y
    const d = Math.hypot(dx, dy) || 0.001
    const min = c.rayon + rayonDe(c, e) + 1
    if (d < min) e.corps = { ...e.corps, x: v.x + (dx / d) * min, y: v.y + (dy / d) * min }
  }
}

/** Une roche dérive tout droit, sans rien voir ; repassée au-delà de son cercle de naissance, elle quitte le monde. */
function deriver(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number): void {
  const b = e.corps
  // PRISE PAR LA TEMPÊTE (Keko, 21/11 : « quand un astéroïde arrive dans le vortex, qu'il soit pris dans la tempête et se
  // déplace comme les autres astéroïdes ; on le fait disparaître dès qu'on a l'occasion, hors du champ de vision » ; puis :
  // « s'il est verrouillé, on supprime son verrouillage ; il devient invincible, sa barre de vie disparaît, il prend
  // exactement le comportement des rochers du vortex : on ne peut ni le cibler ni le détruire, il est inerte ; inutile
  // de calculer pour lui ce qu'on calcule pour les autres rochers ») : entrée dans la tempête, ELLE QUITTE LES ENNEMIS —
  // plus de visée, de coups, de pépites, d'évitement par les insectes — et rejoint `rochesPrises`, son verrou levé
  const A = c.arene
  const ro = e.asteroide!
  if (A.active && Math.hypot(b.x, b.y) > A.rayon) {
    // (… et, comme elles, elle cesse de tourner sur elle-même : figée à l'angle où elle est prise)
    m.rochesPrises.push({ id: e.id, x: b.x, y: b.y, rayon: ro.rayon, graine: ro.graine, angle0: ro.angle0 + ro.vitesseAngulaire * m.t, vitesseAngulaire: 0, butin: butinDeLaRoche(c, ro.pvMax) })
    if (m.verrou === e.id) m.verrou = null
    e.parti = true
    return
  }
  e.corps = { ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt }
  // (à plusieurs : elle ne part que loin de tous, en s'éloignant de chacun)
  const parti = lieuxDesRoches(c, m).every((o) => {
    const dx = e.corps.x - o.x
    const dy = e.corps.y - o.y
    return Math.hypot(dx, dy) > c.invasion.naissance + c.derive.marge + 1 && dx * b.vx + dy * b.vy > 0
  })
  if (parti) e.parti = true
}

/**
 * LE CENTRE DES ROCHES QUI DÉRIVENT : celui du champ — mais LE VAISSEAU ABATTU, c'est son point de retour, là où la
 * caméra est partie (Keko, 21/11 : « quand je suis mort et que la caméra était sur le compteur, j'ai vu un astéroïde
 * passer au même endroit que le compteur et disparaître » : comptées depuis l'épave, loin de là, les roches qu'on voyait
 * passer près du compteur sortaient du monde sous les yeux).
 */
function centreDesRoches(c: ConfigVaisseau, m: Monde): Vecteur {
  // (… DEPUIS LE 21/11, ON REVIENT LÀ OÙ ON EST TOMBÉ : l'épave glisse à son point de retour, la caméra la suit — voir
  // `invasion.retour` ; le centre des roches est le sien, comme en vol)
  if (c.invasion.sansPortail && m.phase === 'perdu') return pointDeRetour(c, m)
  return centreDuChamp(c, m)
}

/** Une roche prise par la tempête (voir `deriver`) : où elle est, et de quoi la peindre. */
export type RochePrise = { id: number; x: number; y: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number; /** Ce qu'elle portait de points (voir `butinDeLaRoche`) : on voit encore ses gemmes. */ butin?: number }

/**
 * LES ROCHES PRISES PAR LA TEMPÊTE (voir `deriver`) : elles tournent autour du centre comme les siennes, à `arene.vitesse`
 * le long du cercle, en glissant vers le milieu de l'anneau ; elles heurtent le vaisseau comme elles (`subirLArene`) ;
 * elles quittent le monde dès qu'elles sont aussi loin du centre des roches que là où les roches naissent (420 : hors de
 * vue même dézoomé au plus — la demi-diagonale de la vue y fait 367).
 */
function menerLesRochesPrises(c: ConfigVaisseau, m: Monde, dt: number): void {
  if (m.rochesPrises.length === 0) return
  const A = c.arene
  const lieux = lieuxDesRoches(c, m)
  const w = vitesseDeLaTempete(c)
  m.rochesPrises = m.rochesPrises.filter((r) => {
    // (elle tourne avec la tempête, d'un bloc, en glissant vers le milieu de l'anneau)
    const rr = Math.hypot(r.x, r.y) || 1
    const vers = rr + (A.rayon + A.largeur / 2 - rr) * Math.min(1, dt * 0.8)
    const a = Math.atan2(r.y, r.x) + w * dt
    r.x = Math.cos(a) * vers
    r.y = Math.sin(a) * vers
    return lieux.some((o) => Math.hypot(r.x - o.x, r.y - o.y) <= c.invasion.naissance + c.derive.marge)
  })
  // (ELLE NE RECOUVRE RIEN — Keko, 21/11 : « des astéroïdes se superposent » : elle se pousse hors des roches de la
  // tempête qu'elle touche, et deux roches prises s'écartent l'une de l'autre ; tournant toutes d'un bloc, elles
  // restent ensuite à leur place)
  for (const r of m.rochesPrises) {
    for (let k = 0; k < A.roches; k++) {
      const q = rocheDeLaTempete(c, k, m.t)
      const dx = r.x - q.x
      const dy = r.y - q.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = r.rayon + q.rayon + 1
      if (d < min) (r.x = q.x + (dx / d) * min), (r.y = q.y + (dy / d) * min)
    }
  }
  for (let i = 0; i < m.rochesPrises.length; i++)
    for (let j = i + 1; j < m.rochesPrises.length; j++) {
      const a = m.rochesPrises[i]
      const b = m.rochesPrises[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = a.rayon + b.rayon + 1
      if (d >= min) continue
      const e = (min - d) / 2
      a.x -= (dx / d) * e
      a.y -= (dy / d) * e
      b.x += (dx / d) * e
      b.y += (dy / d) * e
    }
}

/**
 * LES ROCHES QUI DÉRIVENT SE HEURTENT (Keko, 21/11 : « des astéroïdes se superposent alors qu'ils ne devraient pas ») :
 * deux roches qui se recouvrent sont écartées, et rebondissent l'une sur l'autre — chacune pèse le carré de son rayon,
 * le choc garde `derive.rebond` de leur vitesse relative.
 */
function heurterLesDerives(c: ConfigVaisseau, m: Monde): void {
  const roches = m.ennemis.filter((e) => e.asteroide !== undefined)
  for (let i = 0; i < roches.length; i++)
    for (let j = i + 1; j < roches.length; j++) {
      const a = roches[i]
      const b = roches[j]
      const ra = a.asteroide!.rayon
      const rb = b.asteroide!.rayon
      const dx = b.corps.x - a.corps.x
      const dy = b.corps.y - a.corps.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = ra + rb
      if (d >= min) continue
      const nx = dx / d
      const ny = dy / d
      const ma = ra * ra
      const mb = rb * rb
      const ia = mb / (ma + mb)
      const ib = ma / (ma + mb)
      const vn = (b.corps.vx - a.corps.vx) * nx + (b.corps.vy - a.corps.vy) * ny
      const j_ = vn < 0 ? -(1 + c.derive.rebond) * vn : 0
      a.corps = { ...a.corps, x: a.corps.x - nx * (min - d) * ia, y: a.corps.y - ny * (min - d) * ia, vx: a.corps.vx - nx * j_ * ia, vy: a.corps.vy - ny * j_ * ia }
      b.corps = { ...b.corps, x: b.corps.x + nx * (min - d) * ib, y: b.corps.y + ny * (min - d) * ib, vx: b.corps.vx + nx * j_ * ib, vy: b.corps.vy + ny * j_ * ib }
    }
}

/** LE CENTRE DU CHAMP : le portail, au centre du monde ; sans portail, le vaisseau (voir `sansPortail`). */
function centreDuChamp(c: ConfigVaisseau, m: Monde): Vecteur {
  return c.invasion.sansPortail ? centreDeLEquipage(m) : { x: 0, y: 0 }
}

/**
 * LES INSECTES HEURTENT LES ROCHES (voir `sansPortail`) : un insecte entré dans une roche qui dérive en est sorti ;
 * s'il n'en a pas heurté depuis `heurteRoche` secondes, IL perd `derive.chocInsecte` — comme le vaisseau. LA ROCHE N'A
 * RIEN (Keko, 21/11 : « enlever les dégâts subis par les astéroïdes au contact des autres objets, comme les ennemis ou le
 * joueur ; les ennemis et le joueur subissent des dégâts en collision, mais pas les astéroïdes »).
 */
function heurterLesRoches(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const roches = m.ennemis.filter((e) => e.asteroide !== undefined)
  if (roches.length === 0) return
  for (const e of [...m.ennemis]) {
    if (e.asteroide !== undefined || !m.ennemis.includes(e)) continue
    for (const r of roches) {
      if (!m.ennemis.includes(r)) continue
      const dx = e.corps.x - r.corps.x
      const dy = e.corps.y - r.corps.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = r.asteroide!.rayon + rayonDe(c, e)
      if (d >= min) continue
      e.corps = { ...e.corps, x: r.corps.x + (dx / d) * min, y: r.corps.y + (dy / d) * min }
      if (m.t - (e.heurteA ?? -100) < c.invasion.heurteRoche) continue
      e.heurteA = m.t
      // (UNE ROCHE N'EST PAS UNE ARME — Keko, 23/11 : « n'affiche pas les dégâts infligés par les astéroïdes aux ennemis ;
      // c'est uniquement pour les attaques des vaisseaux du joueur et de ses alliés » — voir `horsArmeA`)
      e.horsArmeA = m.t
      e.pv -= c.derive.chocInsecte
      ev.push({ type: 'ennemiTouche', id: e.id, x: (e.corps.x + r.corps.x) / 2, y: (e.corps.y + r.corps.y) / 2, critique: false })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      break
    }
  }
}

/**
 * LES INSECTES D'ABORD (Keko, 20/11 : « on cible en priorité les ennemis avant de s'attaquer aux astéroïdes ; pour en
 * détruire un, il faut être loin des ennemis, sans ennemi à portée, ou utiliser le verrouillage ») : tant qu'un insecte
 * est à portée du vaisseau — la plus longue de ses armes, 60 au moins —, LES ROCHES SONT MASQUÉES AUX ARMES (pas la
 * verrouillée) : elles ne visent, ne touchent ni ne blessent qu'eux. Rend les roches masquées.
 */
function rochesMasquees(c: ConfigVaisseau, m: Monde): Ennemi[] {
  if (!m.ennemis.some((e) => e.asteroide !== undefined)) return []
  const v = m.vaisseau
  const portee = Math.max(60, ...c.armes.map((a) => Math.max(a.portee, a.orbite?.laisse ?? 0)))
  const insecte = m.ennemis.some((e) => e.asteroide === undefined && Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= portee + rayonDe(c, e))
  return insecte ? m.ennemis.filter((e) => e.asteroide !== undefined && e.id !== m.verrou) : []
}

/**
 * OÙ NAÎT UN INSECTE DU FLOT CONTINU (voir `continu`) : tout autour du vaisseau ; mais quand il file, `devant` des
 * naissances se font dans son axe de vol, à ±`cone`. `k` : une clé du tirage.
 */
function angleDeNaissance(c: ConfigVaisseau, m: Monde, k: number, v: Vaisseau = m.vaisseau): number {
  const fl = c.invasion.continu
  if (Math.hypot(v.vx, v.vy) > 20 && tire(m.graine, k, 51) < fl.devant) return Math.atan2(v.vy, v.vx) + (tire(m.graine, k, 52) * 2 - 1) * fl.cone
  return tire(m.graine, k, 3) * Math.PI * 2
}

/** Un insecte de l'invasion naît sur le cercle de naissance, dans une direction tirée de la graine du monde, tourné vers le portail. */
/** La part d'une sorte d'insectes parmi ceux qui naissent à l'instant `t` du vol (voir `invasion.cornu`). */
export function partDe(c: ConfigVaisseau, sorte: SorteDInsecte, t: number): number {
  const C = c.invasion[sorte]
  return C.part * Math.max(0, Math.min(1, (t - C.debut) / C.montee))
}

function faireNaitreUnInsecte(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  // (dans UN DES CADRANS DE LA VAGUE, à tour de rôle ; pas sur ses bords : un dixième de marge de chaque côté — en flot
  // continu, tout autour)
  const cadrans = m.invasion.cadrans.length > 0 ? m.invasion.cadrans : [0]
  const q = cadrans[m.invasion.nes % cadrans.length]
  // (À PLUSIEURS, AUTOUR DE CHACUN À TOUR DE RÔLE — voir `pilotePourNaitre` : ils peuvent être loin l'un de l'autre)
  const nait = m.equipage === undefined ? null : pilotePourNaitre(m, m.invasion.nes)
  m.invasion.nes += 1
  const a = c.invasion.continu.actif ? angleDeNaissance(c, m, m.prochainId, nait ?? m.vaisseau) : (q + 0.1 + 0.8 * tire(m.graine, m.prochainId, 3)) * (Math.PI / 2)
  m.graine = hache(m.graine, 7)
  // (SANS PORTAIL : autour du vaisseau, hors de sa vue, et il le chasse dès sa naissance)
  const o = nait ?? centreDuChamp(c, m)
  // (DANS L'ARÈNE : un point de naissance tombé dans la tempête est tourné, ou ramené dedans)
  const { x, y } = c.invasion.sansPortail ? dansLArene(c, m, a, c.invasion.naissance, nait ?? undefined) : { x: o.x + Math.cos(a) * c.invasion.naissance, y: o.y + Math.sin(a) * c.invasion.naissance }
  // (UN CORNU, UN CUIRASSIER, selon leurs parts du moment — voir `invasion.cornu`, `invasion.cuirassier`)
  let u = tire(m.graine, m.prochainId, 71)
  let sorte: SorteDInsecte | undefined
  for (const s of SORTES_D_INSECTES) {
    const pa = partDe(c, s, m.t)
    if (u < pa) {
      sorte = s
      break
    }
    u -= pa
  }
  const e: Ennemi = { id: m.prochainId++, corps: { ...nouveauVaisseau(), x, y, cap: Math.atan2(o.y - y, o.x - x) }, pv: c.ennemi.pv * (sorte === undefined ? 1 : c.invasion[sorte].vie), fait: c.invasion.sansPortail ? 'aggro' : 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: cargaisonVide(), ...(sorte === undefined ? {} : { sorte }) }
  m.ennemis.push(e)
  ev.push({ type: 'ennemiApparait', id: e.id, x, y })
}

/** LES VAGUES de l'invasion : une vague commence quand la précédente est finie (plus un insecte) et le repos passé ; ses insectes naissent un à un. */
/**
 * UN COUP EST-IL CRITIQUE ? (la chance des passifs ; au vortex, 1 % de base — Keko, 20/11 : « donne 1 % de chance à chaque
 * dégât d'être un coup critique ») : CHAQUE COUP qui frappe d'un coup en tire un ; les dégâts continus (une zone, un
 * poison, un rayon qui chauffe) n'ont pas de coup à tirer.
 */
/** LE CRITIQUE D'UNE ARME : celui du vaisseau (le même pour toutes) plus le sien (voir `Arme.critique`). */
const chanceDeCritique = (c: ConfigVaisseau, a: Arme | undefined): number => c.passifs.critique + (a?.critique ?? 0)
const facteurDeCritique = (c: ConfigVaisseau, a: Arme | undefined): number => c.passifs.critiqueFacteur + (a?.critiques ?? 0)
/**
 * LES CARTES SPÉCIALES D'ÉLÉMENT (Keko, 24/11 : « des cartes spéciales de chaque élément » — multicolores, au pool des
 * spéciales, si une attaque portée applique l'élément ; voir `MUTATIONS`, `ConfigVaisseau.elementaires`) — leurs chiffres :
 * - GEL PROFOND : un coup de givre sur un insecte déjà sous givre a 15 % de chance de le geler net 1,5 s (pris dans la
 *   glace, immobile, il ne mord pas) — « 15 %, 1,5 s », choisi par Keko ;
 * - PROPAGATION : chaque seconde, un insecte en feu allume ses voisins presque collés, à 6 de bord à bord — choisi par Keko ;
 * - POINT FAIBLE : un insecte rongé prend +25 points de chance critique et +50 points de dégâts critiques (150 % → 200 %) —
 *   « +25 points », choisi par Keko ;
 * - FOUDRE (à la place de la Paralysie, le même jour — Keko : « ça fait doublon avec le gel ; je préfère garder le givre pour
 *   le contrôle ; quand l'effet d'électrocution est appliqué, une chance pour qu'un éclair tombe du ciel sur la cible ») :
 *   chaque fois qu'un coup électrique ou un arc électrocute un insecte, 10 % de chance que la foudre tombe sur lui : 150,
 *   et la moitié à ce qui est à 20 autour — « 10 %, 150, petite zone », choisi par Keko. Les mêmes partout, comme l'arc.
 * LA SECONDE CARTE DE CHAQUE ÉTAT (Keko, 24/11 : « une carte de plus spéciale pour chaque état, à commencer par la
 * corrosion ») :
 * - DISSOLUTION : un insecte qui meurt rongé laisse une flaque d'acide là où il est mort, d'un rayon de 1,5 fois le sien,
 *   3 s — elle ronge ce qui y passe, et le blesse de 30 par seconde (« ronge et blesse, mais pour 30/s », « 1,5 fois la
 *   taille, 3 s », le nom : Keko). La flaque est une plaque de la traînée corrosive de la Vouivre (`Givre`, `poison`).
 * - COMBUSTION (Keko : « les ennemis qui meurent alors qu'ils sont affectés par brûlure déclenchent une explosion ») : 60
 *   à tout ce qui est à trois fois son rayon ; elle n'allume rien — un insecte en feu qu'elle tue explose à son tour, pas
 *   plus (« 60, à sa taille ×3 », le nom : Keko).
 * - SURTENSION (Keko : « lorsque l'effet d'électrocution se déclenche, à la place de toucher un autre ennemi proche, la
 *   cible déclenche son effet sur tous les ennemis à portée ») : l'arc frappe tous les insectes à son saut, pas le plus
 *   proche seul — chacun ses dégâts, électrocuté (le nom : Keko).
 * - AURA GLACIALE (Keko : « tous les ennemis dans une zone autour du vaisseau ont automatiquement l'effet givre ; ça
 *   n'inflige pas de dégâts, et ça ne peut pas déclencher la congélation de l'autre carte de givre ») : tout insecte à 50
 *   du vaisseau est sous givre, au ralenti le plus fort des armes portées (leurs cartes « Givre » comprises) ; ce n'est
 *   pas un coup : Gel profond ne s'y déclenche pas (« 50 », le nom : Keko).
 */
export const ELEMENTAIRES = { gelure: { chance: 0.15, duree: 1.5 }, incendie: { ecart: 6, periode: 1 }, vulnerabilite: { chance: 0.25, facteur: 0.5 }, foudre: { chance: 0.1, degats: 150, rayon: 20, part: 0.5 }, dissolution: { taille: 1.5, duree: 3, dps: 30 }, combustion: { degats: 60, taille: 3 }, auraGlaciale: { rayon: 50, ralenti: 0.5 } }
/** UN INSECTE VULNÉRABLE (« Point faible ») : rongé, il prend plus de critiques, et plus forts. */
const vulnerable = (c: ConfigVaisseau, m: Monde, e: Ennemi | undefined): boolean => e !== undefined && c.elementaires.vulnerabilite && e.acide !== undefined && e.acide.jusque > m.t
/** UN COUP CRITIQUE SUR `e` ? Sa chance, celle de l'arme et du vaisseau, et de `e` s'il est vulnérable ; `u` n'est tiré que si elle n'est pas nulle. */
const critiqueSur = (c: ConfigVaisseau, m: Monde, a: Arme | undefined, e: Ennemi | undefined, u: () => number): boolean => {
  const ch = chanceDeCritique(c, a) + (vulnerable(c, m, e) ? ELEMENTAIRES.vulnerabilite.chance * (1 + c.renforts.corrosion) : 0)
  return ch > 0 && u() < ch
}
/** Le facteur d'un coup critique sur `e` (voir `critiqueSur`). */
const facteurSur = (c: ConfigVaisseau, m: Monde, a: Arme | undefined, e: Ennemi | undefined): number => facteurDeCritique(c, a) + (vulnerable(c, m, e) ? ELEMENTAIRES.vulnerabilite.facteur * (1 + c.renforts.corrosion) : 0)
const critiqueTire = (c: ConfigVaisseau, m: Monde, a: Arme | undefined, e?: Ennemi): boolean => critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))

/**
 * LA VIE DU VAISSEAU À UNE AUTRE ÉCHELLE (Keko, 20/11 : « les chiffres utilisés pour la vie sont trop faibles ; 9 points
 * de vie, c'est beaucoup trop faible ; donne-leur un multiple, genre ×50, et pense l'échelle de dégâts en fonction ») :
 * le blindage, le bouclier et sa recharge, et TOUT CE QUI LUI FAIT DU MAL — la morsure d'un insecte, les chocs, la
 * corruption — fois `k` ; l'unité de vie aussi (un talent « un point de plus » en ajoute `k`). Les plaques, le déphasage
 * et la régénération (une part de la vie pleine) n'ont pas d'échelle.
 */
export function vieMultipliee(c: ConfigVaisseau, k: number): ConfigVaisseau {
  return {
    ...c,
    coque: c.coque * k,
    bouclier: { ...c.bouclier, points: c.bouclier.points * k, regain: c.bouclier.regain * k },
    corruption: { ronge: c.corruption.ronge * k, purge: c.corruption.purge * k },
    invasion: { ...c.invasion, morsure: c.invasion.morsure * k },
    collision: { ...c.collision, degatsCoque: c.collision.degatsCoque * k },
    uniteDeVie: c.uniteDeVie * k,
  }
}

/** Les champs de dégâts d'une arme (ceux qu'une échelle multiplie) — jamais une portée, un rayon, une durée ni une part. */
export const CHAMPS_DE_DEGATS: ReadonlySet<string> = new Set(['degats', 'dps', 'dpsBrulure', 'budget', 'morsure', 'arrache', 'fin'])
/**
 * UNE ARME À UNE AUTRE ÉCHELLE (Keko, 20/11 : « je ne veux pas de chiffres à virgule ; le dégât minimum infligé doit être
 * 1 — multiplie les dégâts et les PV ennemis par un facteur qui résolve ce problème ») : tous ses champs de dégâts, à
 * toute profondeur, multipliés par `k` et arrondis à l'entier.
 */
export function degatsMultiplies<A>(a: A, k: number): A {
  const fois = (o: unknown): unknown => {
    if (o === null || typeof o !== 'object' || Array.isArray(o)) return o
    const r: Record<string, unknown> = {}
    for (const [cle, v] of Object.entries(o)) r[cle] = typeof v === 'number' && CHAMPS_DE_DEGATS.has(cle) ? Math.round(v * k) : fois(v)
    return r
  }
  return fois(a) as A
}

/**
 * LES INSECTES NE S'EMPILENT PAS (Keko, 20/11 : « empêche les ennemis de se paquer au même endroit : si on tourne
 * autour, ils se regroupent en un seul point, ce n'est pas très beau ») : deux insectes plus proches que leurs deux
 * rayons et `ecart` se repoussent, chacun de la moitié de ce qui manque — un insecte saisi (une vrille le tient) ne
 * bouge pas, l'autre fait tout le chemin. Une grille de cases de cette distance : on ne compare que les voisins.
 */
function ecarterLesInsectes(c: ConfigVaisseau, m: Monde): void {
  // (la case : l'écart de deux des plus gros ; chaque paire garde le sien, selon leurs rayons)
  const cas = 2 * c.ennemi.rayon * Math.max(1, ...SORTES_D_INSECTES.map((s) => c.invasion[s].taille)) + c.invasion.ecart
  const grille = new Map<number, Ennemi[]>()
  const cle = (i: number, j: number): number => i * 100003 + j
  for (const e of m.ennemis) {
    if (e.asteroide !== undefined) continue
    const k = cle(Math.floor(e.corps.x / cas), Math.floor(e.corps.y / cas))
    const l = grille.get(k)
    if (l === undefined) grille.set(k, [e])
    else l.push(e)
  }
  const tenu = (e: Ennemi): boolean => (e.tenuA ?? -1) > m.t && e.grand !== true
  for (const e of m.ennemis) {
    if (e.asteroide !== undefined) continue
    const i0 = Math.floor(e.corps.x / cas)
    const j0 = Math.floor(e.corps.y / cas)
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        for (const o of grille.get(cle(i0 + di, j0 + dj)) ?? []) {
          if (o.id <= e.id) continue
          let dx = o.corps.x - e.corps.x
          let dy = o.corps.y - e.corps.y
          let d = Math.hypot(dx, dy)
          const min = rayonDe(c, e) + rayonDe(c, o) + c.invasion.ecart
          if (d >= min) continue
          // (pile au même point : on les sépare selon leurs identités, toujours dans le même sens)
          if (d < 1e-6) {
            const a = ((e.id * 7 + o.id * 13) % 360) * (Math.PI / 180)
            dx = Math.cos(a)
            dy = Math.sin(a)
            d = 1
          }
          const manque = min - d
          const te = tenu(e)
          const to = tenu(o)
          if (te && to) continue
          const pe = te ? 0 : to ? 1 : 0.5
          const po = 1 - pe
          e.corps = { ...e.corps, x: e.corps.x - (dx / d) * manque * pe, y: e.corps.y - (dy / d) * manque * pe }
          o.corps = { ...o.corps, x: o.corps.x + (dx / d) * manque * po, y: o.corps.y + (dy / d) * manque * po }
        }
  }
}

/**
 * LE PAS DES NAISSANCES D'UNE VAGUE (Keko, 20/11 : « augmente progressivement le nombre d'ennemis qui spawnent par vague :
 * on a toujours le même nombre, ça devient difficile de tester l'efficacité d'une arme ») : une vague comptait déjà
 * `renfort` insectes de plus que la précédente, mais ils naissaient un par un toutes les `cadence` secondes — à l'écran,
 * toujours le même filet, la vague ne faisait que durer plus longtemps. DÉSORMAIS UNE VAGUE NAÎT EN UN MÊME TEMPS, celui
 * de la première : ses insectes arrivent d'autant plus serrés qu'elle est grosse (4 insectes en 6,6 s, puis 6, 8, 10…
 * dans le même temps) ; jamais plus d'un tous les `cadenceMin`.
 */
export function cadenceDeLaVague(c: ConfigVaisseau, vague: number): number {
  const nombre = c.invasion.vague + (Math.max(1, vague) - 1) * c.invasion.renfort
  return Math.max(c.invasion.cadenceMin, (c.invasion.cadence * (c.invasion.vague - 1)) / Math.max(1, nombre - 1))
}

function menerLInvasion(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const inv = m.invasion
  if (m.t < inv.prochainA) return
  // LE FLOT CONTINU (voir `continu`) : un insecte, puis le suivant au rythme du moment
  const fl = c.invasion.continu
  if (fl.actif) {
    inv.prochainA = m.t + 1 / Math.min(fl.max, fl.debut + (fl.montee * m.t) / 60)
    if (m.ennemis.filter((e) => e.asteroide === undefined).length < fl.vivantsMax) faireNaitreUnInsecte(c, m, ev)
    return
  }
  if (inv.aNaitre === 0) {
    if (m.ennemis.some((e) => e.asteroide === undefined)) return
    inv.vague += 1
    inv.aNaitre = c.invasion.vague + (inv.vague - 1) * c.invasion.renfort
    // SES CADRANS : un par joueur, tirés de la graine — le premier n'est pas celui de la vague d'avant
    const combien = Math.max(1, Math.min(4, Math.round(c.invasion.joueurs)))
    const avant = inv.cadrans[0]
    const reste = [0, 1, 2, 3]
    const tires: number[] = []
    for (let k = 0; k < combien; k++) {
      const choix = k === 0 && combien < 4 && avant !== undefined ? reste.filter((x) => x !== avant) : reste
      const pris = choix[hache(m.graine, inv.vague, k) % choix.length]
      tires.push(pris)
      reste.splice(reste.indexOf(pris), 1)
    }
    inv.cadrans = tires
    inv.nes = 0
    ev.push({ type: 'vague', numero: inv.vague, nombre: inv.aNaitre, cadrans: tires })
  }
  faireNaitreUnInsecte(c, m, ev)
  inv.aNaitre -= 1
  inv.prochainA = m.t + (inv.aNaitre > 0 ? cadenceDeLaVague(c, inv.vague) : c.invasion.repos)
}

/**
 * CE QUE LE VAISSEAU A POSÉ ATTIRE LES INSECTES SUR LUI (Keko, 20/11 : « quand un ennemi se trouve à portée d'un
 * rejeton, du Kraken, d'une tourelle ou de n'importe quelle chose que le vaisseau pose, il aggro sur le vaisseau ») : un
 * insecte à portée d'une tourelle déployée (la portée de son arme), d'un rejeton ou d'un mini-ver (leur vue), d'une vrille
 * (son allonge) ou d'une mine posée (sa zone) prend le vaisseau en chasse — même hors de `aggro`, même pendant son
 * calme — et ne le lâche pas tant qu'il y est.
 * (… ET CE QU'IL SÈME AU SOL — Keko, 20/11, « oui » à : « les flaques, les traînées et les cristaux, faut-il qu'un ennemi
 * qui marche dedans prenne aussi le vaisseau en chasse ? » : un insecte DANS une flaque de feu (le napalm, la traînée du
 * rayon thermique), une plaque de givre, de poison ou de verglas, une flaque d'acide, ou SUR la ligne de deux cristaux.)
 */
function aPorteeDUnePose(c: ConfigVaisseau, m: Monde, e: Ennemi): boolean {
  const b = e.corps
  const pres = (x: number, y: number, r: number | undefined): boolean => r !== undefined && Math.hypot(b.x - x, b.y - y) <= r + c.ennemi.rayon
  const arme = (i: number): Arme | undefined => c.armes[i]
  return m.tourelles.some((t) => t.deployee && pres(t.x, t.y, arme(t.arme)?.portee))
    || m.rejetons.some((r) => pres(r.x, r.y, arme(r.arme)?.rejeton?.vue))
    || m.miniVers.some((v) => pres(v.x, v.y, arme(v.arme)?.ponte?.vue))
    || m.vrilles.some((v) => pres(v.x, v.y, arme(v.arme)?.vrille?.allonge))
    || m.mines.some((mi) => {
      const a = arme(mi.arme)?.mine
      return a !== undefined && m.t >= mi.lancee + a.vol && pres(mi.x, mi.y, a.rayon)
    })
    || m.flaques.some((f) => pres(f.x, f.y, f.rayon))
    || m.givres.some((g) => pres(g.x, g.y, g.rayon))
    || m.flaquesAcides.some((f) => {
      const a = arme(f.arme)
      return a?.crachat !== undefined && dansLeCone(b.x, b.y, f.x, f.y, f.cap, a.crachat.cone, a.portee, c.ennemi.rayon)
    })
    || m.balises.some((ba) => ba.liens.some((li) => li.sur.includes(e.id)))
}

/** Ce que fait UN INSECTE pendant `dt` : il marche vers le portail et le traverse ; ou il chasse le joueur qui l'a approché, le mord, et le lâche s'il est entraîné trop loin. */
function conduireLInsecte(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
  const I = c.invasion
  const b = e.corps
  // (À PLUSIEURS, IL CHASSE LE VAISSEAU EN VOL LE PLUS PROCHE DE LUI — voir `avancerLEquipage` ; Keko, 21/11 : « à plusieurs
  // joueurs, ils iraient vers les autres » ; seul, le vaisseau du joueur, s'il vole)
  const cible = cibleDeLInsecte(m, b)
  const v = cible?.v ?? m.vaisseau
  const enVol = cible !== null
  const abattu = m.equipage === undefined ? m.phase === 'perdu' : !enVol
  const dj = Math.hypot(v.x - b.x, v.y - b.y) || 1
  const dp = Math.hypot(b.x, b.y) || 1
  // LE CONTOUR DU PORTAIL : qui le touche est téléporté, en chasse ou non — il quitte le monde (la page joue sa disparition)
  if (!I.sansPortail && dp <= I.portail) {
    e.parti = true
    m.invasion.passes += 1
    ev.push({ type: 'traverse', id: e.id, x: b.x, y: b.y })
    // (chaque insecte passé entame le portail ; à zéro, c'est la fin de la partie)
    if (!m.invasion.finie) {
      m.invasion.vie = Math.max(0, m.invasion.vie - I.degatsAuPortail)
      if (m.invasion.vie <= 0) {
        m.invasion.finie = true
        ev.push({ type: 'fin', vague: m.invasion.vague })
      }
    }
    return []
  }
  // DANS LA TEMPÊTE, IL SUBIT CE QUE SUBIT LE JOUEUR (Keko, 21/11 : « si les ennemis vont dans le vortex, ils doivent subir
  // les mêmes dégâts que le joueur ; un ennemi qui meurt dans le vortex ne lâche aucune pépite ») : `arene.dps` unités de
  // vie par seconde ; il y meurt sans butin
  if (c.arene.active && Math.hypot(b.x, b.y) > c.arene.rayon) {
    e.horsArmeA = m.t
    e.pv -= c.arene.dps * c.uniteDeVie * dt
    if (e.pv <= 0) {
      abattreLEnnemi(c, m, e, ev, true)
      return []
    }
  }
  // (CE QUE LE VAISSEAU A POSÉ L'ATTIRE SUR LUI — voir `aPorteeDUnePose`)
  const attire = enVol && aPorteeDUnePose(c, m, e)
  // (LE TRAÎNARD REVIENT DEVANT — voir `continu.recycle` : resté trop loin derrière, il réapparaît hors de vue, dans l'axe
  // de vol du vaisseau)
  if (I.continu.actif && enVol && dj > I.continu.recycle) {
    const cle = Math.floor(m.t * 10)
    // (à plusieurs : devant celui qu'il chasse)
    const a = Math.hypot(v.vx, v.vy) > 20 ? angleDeNaissance(c, m, e.id * 7919 + cle, v) : Math.atan2(b.y - v.y, b.x - v.x) + (tire(m.graine, e.id, 53, cle) * 2 - 1) * I.continu.cone
    const { x, y } = dansLArene(c, m, a, I.naissance * (1 + I.continu.etalement * tire(m.graine, e.id, 54, cle)), v)
    e.corps = { ...b, x, y, vx: 0, vy: 0, cap: Math.atan2(v.y - y, v.x - x) }
    return []
  }
  // (SANS PORTAIL, il chasse toujours le vaisseau — abattu, il erre : voir plus bas)
  if (I.sansPortail) e.fait = 'aggro'
  else if (e.fait === 'aggro') {
    // (IL LÂCHE QUAND LE JOUEUR S'ÉLOIGNE TROP DE LUI — Keko, 16/11 : « qu'ils poursuivent le joueur beaucoup plus loin dans
    // l'espace ; que l'ennemi arrête de suivre le joueur quand le joueur s'éloigne trop de lui, mais tant qu'il est à une
    // certaine distance, il peut le poursuivre très loin » : plus de laisse autour du portail — il lâche à `lache` du
    // joueur, ou le joueur abattu ; jamais tant qu'il est à portée de ce que le vaisseau a posé)
    if (!enVol || (dj > I.lache && !attire)) {
      e.fait = 'marche'
      e.calmeA = m.t + I.calme
    }
  } else if (attire || (enVol && dj <= I.aggro && m.t >= (e.calmeA ?? 0))) e.fait = 'aggro'
  else e.fait = 'marche'
  // (FIGÉ — pris dans la glace, paralysé —, il ne mord pas, et ne bouge pas : voir plus bas)
  const fige = (e.figeA ?? -1) > m.t
  let direction: Vecteur
  if (I.sansPortail && abattu) {
    // LE JOUEUR ABATTU, ILS ERRENT (Keko, 21/11 : « à partir du moment où un ennemi réussit à nous tuer, on laisse les
    // ennemis se déplacer un peu au hasard — à plusieurs joueurs, ils iraient vers les autres ; seul, ils déambulent, pour
    // éviter qu'ils se regroupent tous comme des idiots à l'endroit où on va respawn ») : chacun suit son cap, tiré de son
    // identité, qui tourne doucement au fil du temps (deux sinus lents : rien n'est gardé), à `errance` de sa poussée
    const a = tire(m.graine, e.id, 61) * Math.PI * 2 + 1.3 * Math.sin(m.t * 0.23 + e.id * 1.7) + 0.8 * Math.sin(m.t * 0.51 + e.id * 0.37)
    direction = { x: Math.cos(a) * I.errance, y: Math.sin(a) * I.errance }
  } else if (e.fait === 'aggro') {
    direction = { x: (v.x - b.x) / dj, y: (v.y - b.y) / dj }
    if (enVol && !fige && dj <= c.rayon + rayonDe(c, e) + 2 && m.t >= (e.mordA ?? 0)) {
      e.mordA = m.t + I.cadenceMorsure
      // (un autre pilote que celui dont c'est le tour : sa morsure l'attend, il l'encaissera à son tour)
      const degats = I.morsure * gabaritDInsecte(c, e).morsure
      if (m.equipage === undefined || cible!.k === m.equipage.actif) encaisser(c, m, v.x, v.y, degats, ev)
      else m.equipage.pilotes[cible!.k].morsures.push({ x: v.x, y: v.y, degats })
    }
  } else direction = { x: -b.x / dp, y: -b.y / dp }
  // (IL ÉVITE LES ROCHES QUI DÉRIVENT : à moins de `eviteRoche` de leur bord, il s'en écarte d'autant plus qu'il en est près)
  if (I.sansPortail) {
    let ex = 0
    let ey = 0
    for (const r of m.ennemis) {
      if (r.asteroide === undefined) continue
      const dx = b.x - r.corps.x
      const dy = b.y - r.corps.y
      const d = Math.hypot(dx, dy) || 0.001
      const marge = d - r.asteroide.rayon - rayonDe(c, e)
      if (marge >= I.eviteRoche) continue
      const k = 2.5 * (1 - Math.max(0, marge) / I.eviteRoche)
      // (il s'en écarte ET LA CONTOURNE : une poussée de côté, du côté où il allait — pile en face, selon son identité ;
      // sans elle, un insecte aligné sur la roche et le vaisseau butait dessus)
      const nx = dx / d
      const ny = dy / d
      const vers = -ny * direction.x + nx * direction.y
      const cote = Math.abs(vers) > 0.05 ? Math.sign(vers) : e.id % 2 === 0 ? 1 : -1
      ex += (nx * 0.6 - ny * cote) * k
      ey += (ny * 0.6 + nx * cote) * k
    }
    if (ex !== 0 || ey !== 0) {
      const sx = direction.x + ex
      const sy = direction.y + ey
      const n = Math.hypot(sx, sy) || 1
      direction = { x: sx / n, y: sy / n }
    }
  }
  // (IL ÉVITE LA TEMPÊTE — voir `eviteTempete` : repoussé vers le centre, d'autant plus fort qu'il en est près, plus fort que
  // sa chasse au bord même)
  // (EN CHASSE, IL VA JUSQU'AU BORD — Keko, 22/11 : « si je longe le vortex, les ennemis ne me touchent jamais » : repoussé
  // dès `eviteTempete` du bord, il s'arrêtait à soixante de lui, et un vaisseau qui le longeait était hors d'atteinte. Il
  // perd seulement, sur `approcheDuBord`, la part de sa course qui va vers la tempête, et n'est repoussé qu'au bord même)
  const chasse = e.fait === 'aggro' && !(I.sansPortail && abattu)
  if (c.arene.active && chasse) {
    const dc = Math.hypot(b.x, b.y) || 1
    const bord = c.arene.rayon - rayonDe(c, e)
    const ux = b.x / dc
    const uy = b.y / dc
    const sort = direction.x * ux + direction.y * uy
    const u = (dc - (bord - I.approcheDuBord)) / I.approcheDuBord
    if (u > 0) {
      const r = (sort > 0 ? sort * Math.min(1, u) : 0) + (dc > bord ? 3 * Math.min(1.5, (dc - bord) / I.approcheDuBord) : 0)
      const sx = direction.x - ux * r
      const sy = direction.y - uy * r
      const n = Math.hypot(sx, sy) || 1
      direction = { x: sx / n, y: sy / n }
    }
  } else if (c.arene.active) {
    const dc = Math.hypot(b.x, b.y) || 1
    const seuil = c.arene.rayon - I.eviteTempete
    if (dc > seuil) {
      // (SA COURSE Y EST RENVOYÉE, pas contrée — Keko, 22/11 : « quand je meurs, les ennemis tournent parfois sur place dans
      // une rotation bizarre par à-coups » : repoussé d'une force qui grandissait vers le bord, l'insecte qui errait vers la
      // tempête s'arrêtait là où elle égalait sa course, et ce qui restait de leur somme, presque rien, basculait d'un côté à
      // l'autre — douze demi-tours en huit secondes, en bande le long du bord. Désormais la part de sa course qui va vers la
      // tempête se renverse, d'autant plus qu'il en est près : il glisse et repart vers le milieu, sans jamais s'arrêter ;
      // DANS la tempête, il en est chassé comme avant)
      const w = (dc - seuil) / I.eviteTempete
      const ux = b.x / dc
      const uy = b.y / dc
      const sort = direction.x * ux + direction.y * uy
      // (de rien au seuil — sinon il cassait sa course en y entrant — à tout renversée au bord)
      const r = Math.max(0, sort) * 2 * Math.min(1, w) + (w > 1 ? 3 * Math.min(1.5, w - 1) : 0)
      const sx = direction.x - ux * r
      const sy = direction.y - uy * r
      const n = Math.max(1, Math.hypot(sx, sy))
      direction = { x: sx / n, y: sy / n }
    }
  }
  // (FIGÉ, il reste où il est — voir `Ennemi.figeA`)
  if (fige) {
    e.corps = { ...b, vx: 0, vy: 0 }
    return []
  }
  // (GELÉ, il avance à une part de sa vitesse : son moteur et sa pointe baissent d'autant, et il est freiné tout de suite)
  const gele = (e.geleA ?? -1) > m.t
  // (UN CORNU, UN CUIRASSIER vont moins vite — voir `invasion.cornu`)
  const k = (gele ? (e.ralenti ?? 1) : 1) * gabaritDInsecte(c, e).vitesse
  e.corps = voler(c, k !== 1 ? { ...c.ennemi, poussee: c.ennemi.poussee * k, vitesseMax: c.ennemi.vitesseMax * k } : c.ennemi, b, dt, direction, m.detruits).vaisseau
  const vit = Math.hypot(e.corps.vx, e.corps.vy)
  if (gele && vit > c.ennemi.vitesseMax * k) e.corps = { ...e.corps, vx: (e.corps.vx * c.ennemi.vitesseMax * k) / vit, vy: (e.corps.vy * c.ennemi.vitesseMax * k) / vit }
  // (… ET N'Y ENTRE PAS : son élan l'y aurait porté ; au bord, il est retenu, sa vitesse vers la tempête perdue — il glisse
  // le long d'elle)
  if (c.arene.active && chasse) {
    const dc = Math.hypot(e.corps.x, e.corps.y) || 1
    const bord = c.arene.rayon - rayonDe(c, e)
    // (seulement s'il était en deçà : un insecte que la tempête tient déjà — projeté par un coup — en est repoussé, plus haut)
    if (dc > bord && Math.hypot(b.x, b.y) <= bord + 0.5) {
      const ux = e.corps.x / dc
      const uy = e.corps.y / dc
      const sort = Math.max(0, e.corps.vx * ux + e.corps.vy * uy)
      e.corps = { ...e.corps, x: ux * bord, y: uy * bord, vx: e.corps.vx - ux * sort, vy: e.corps.vy - uy * sort }
    }
  }
  return []
}

/** Ce que fait un ennemi pendant `dt` : il chasse le joueur s'il le voit, sinon il mine la roche la plus proche de lui. Rend ses chocs. */
function conduireLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
  if (e.asteroide !== undefined) {
    deriver(c, m, e, dt)
    return []
  }
  // (TENU PAR UNE VRILLE, un petit ne bouge plus, ne mord ni ne tire — voir `Arme.vrille`)
  if ((e.tenuA ?? -1) > m.t && e.grand !== true) {
    e.corps = { ...e.corps, vx: 0, vy: 0 }
    return []
  }
  if (c.invasion.active) return conduireLInsecte(c, m, e, dt, ev)
  const v = m.vaisseau
  const b = e.corps
  const dxj = v.x - b.x
  const dyj = v.y - b.y
  const dj = Math.hypot(dxj, dyj) || 1
  let direction: Vecteur = { x: 0, y: 0 }
  e.forage = null
  const charge = e.butin >= c.ennemi.fuit
  if (charge && (dj <= c.ennemi.voit || (e.fait === 'fuit' && dj <= c.ennemi.lache)) && m.phase === 'vol') {
    // LA FUITE : chargé, il protège son butin — plein gaz à l'opposé du joueur, sans tirer (Keko : « avec beaucoup de
    // ressources, ils fuient le joueur ») ; hors de vue, il retourne miner
    e.fait = 'fuit'
    e.roche = null
    direction = { x: -dxj / dj, y: -dyj / dj }
  } else if (!charge && (dj <= c.ennemi.voit || (m.extraction > 0 && dj <= c.ennemi.accourt)) && m.phase === 'vol') {
    // LA CHASSE : il se tient à distance du joueur (il s'approche s'il est loin, recule s'il est trop près), et tire avec
    // de l'avance — dès qu'il le voit, ou de plus loin quand une EXTRACTION est en cours (il accourt, sans tirer tant
    // qu'il ne le voit pas)
    e.fait = 'chasse'
    const ecart = dj - c.ennemi.tient
    const k = Math.max(-1, Math.min(1, ecart / 25))
    direction = { x: (dxj / dj) * k, y: (dyj / dj) * k }
    if (c.ennemi.armes.length > 0) {
      // SES ARMES, chacune à sa cadence et à sa portée — leurs premiers tirs décalés, pour qu'elles ne partent pas ensemble
      if (e.tirsA === undefined) e.tirsA = c.ennemi.armes.map((a, k) => m.t + 0.3 + (a.cadence * k) / c.ennemi.armes.length)
      const ca = Math.cos(b.cap)
      const sa = Math.sin(b.cap)
      c.ennemi.armes.forEach((a, k) => {
        if (m.t < e.tirsA![k] || dj > Math.min(a.portee, c.ennemi.voit)) return
        e.tirsA![k] = m.t + a.cadence
        // (sa bouche, sur le vaisseau, si le rendu l'a posée ; sinon le bord, vers la cible)
        const x0 = a.bouche === undefined ? b.x : b.x + a.bouche.x * ca - a.bouche.y * sa
        const y0 = a.bouche === undefined ? b.y : b.y + a.bouche.x * sa + a.bouche.y * ca
        const temps = dj / a.vitesse
        const angle = Math.atan2(v.y + v.vy * temps - y0, v.x + v.vx * temps - x0) + (tire(m.graine, m.prochainId, 9) - 0.5) * 2 * a.dispersion
        m.tirs.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * c.ennemi.partDesDegats, guide: a.guide, arme: a.id })
        ev.push({ type: 'tir', x: x0, y: y0 })
      })
    } else if (m.t >= e.tirA && dj <= c.ennemi.voit) {
      e.tirA = m.t + c.ennemi.cadence
      const temps = dj / c.ennemi.vitesseTir
      const cx = v.x + v.vx * temps - b.x
      const cy = v.y + v.vy * temps - b.y
      // un peu de dispersion, tirée du monde : un joueur qui bouge peut esquiver, un joueur immobile n'est pas touché à tous les coups
      const angle = Math.atan2(cy, cx) + (tire(m.graine, m.prochainId, 9) - 0.5) * 2 * c.ennemi.dispersion
      const x0 = b.x + Math.cos(angle) * (c.ennemi.rayon + 3)
      const y0 = b.y + Math.sin(angle) * (c.ennemi.rayon + 3)
      m.tirs.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * c.ennemi.vitesseTir, vy: Math.sin(angle) * c.ennemi.vitesseTir, vie: c.ennemi.vieTir })
      ev.push({ type: 'tir', x: x0, y: y0 })
    }
  } else {
    // LA MINE : sa roche, ou la plus proche de lui ; il s'en approche à portée de laser, puis la creuse ; sans roche, il dérive vers le joueur
    e.fait = 'mine'
    let roche: Asteroide | null = null
    if (e.roche !== null && !m.detruits.has(e.roche)) roche = asteroidesVisibles(c, m, b.x, b.y, c.ennemi.cherche + c.champ.rayonMax).find((a) => a.id === e.roche) ?? null
    if (roche === null) {
      // la roche la plus proche de LUI, parmi celles où il RÔDE (à `rode` du joueur, hors écran) : il mine là où il est et on
      // le croise (venir exprès dans le coin du joueur le rendait « trop présent » ; sans laisse, il se perdait)
      let meilleure: Asteroide | null = null
      let dmin = Infinity
      for (const r of asteroidesVisibles(c, m, b.x, b.y, c.ennemi.cherche + c.champ.rayonMax)) {
        const dv = Math.hypot(r.x - v.x, r.y - v.y) - r.rayon
        if (dv > c.ennemi.rode || (charge && dv < c.ennemi.lache)) continue // (chargé : pas de roche à portée de vue du joueur)
        const d = Math.hypot(r.x - b.x, r.y - b.y) - r.rayon
        if (d <= c.ennemi.cherche && d < dmin) (dmin = d), (meilleure = r)
      }
      roche = meilleure
      e.roche = roche?.id ?? null
    }
    // sans roche à miner autour de lui où il rôde, il revient vers le joueur — chargé, il reste au large
    if (roche === null) {
      if (!charge) direction = { x: (dxj / dj) * 0.7, y: (dyj / dj) * 0.7 }
      else if (dj < c.ennemi.lache) direction = { x: -dxj / dj, y: -dyj / dj }
    }
    else {
      const dx = roche.x - b.x
      const dy = roche.y - b.y
      const d = Math.hypot(dx, dy) - roche.rayon
      if (d > c.forage.portee - 12) {
        const k = Math.min(1, (d - (c.forage.portee - 12)) / 30 + 0.3)
        direction = { x: (dx / (d + roche.rayon)) * k, y: (dy / (d + roche.rayon)) * k }
      } else {
        // à portée : il freine (pousse contre sa vitesse) et creuse
        const vit = Math.hypot(b.vx, b.vy)
        if (vit > 4) direction = { x: (-b.vx / vit) * Math.min(1, vit / 30), y: (-b.vy / vit) * Math.min(1, vit / 30) }
        e.forage = creuserLaRoche(c, m, roche, b, c.forage.debit * dt, ev)
        if (e.forage === null) e.roche = null
      }
    }
  }
  // il évite les roches qui ne sont pas la sienne : poussé à l'écart de celles qu'il frôle
  for (const r of asteroidesVisibles(c, m, b.x, b.y, c.collision.evite + c.champ.rayonMax)) {
    if (e.roche === r.id && e.fait === 'mine') continue
    const dx = b.x - r.x
    const dy = b.y - r.y
    const dist = Math.hypot(dx, dy) || 1
    const marge = dist - r.rayon - c.ennemi.rayon
    if (marge > c.collision.evite) continue
    const k = (1 - Math.max(0, marge) / c.collision.evite) * 1.3
    direction = { x: direction.x + (dx / dist) * k, y: direction.y + (dy / dist) * k }
  }
  const l = Math.hypot(direction.x, direction.y)
  if (l > 1) direction = { x: direction.x / l, y: direction.y / l }
  const r = voler(c, c.ennemi, b, dt, direction, m.detruits)
  e.corps = r.vaisseau
  // en chasse, le nez reste sur le joueur
  // EN CHASSE, SON NEZ TOURNE VERS LE JOUEUR À SA MANIABILITÉ, PLUS D'UN COUP (Keko, 14/11 : le cuirassé rival « se
  // retourne instantanément vers moi, et la pointe de son vaisseau suit mon chasseur à toute vitesse » — le cap était
  // posé droit sur le joueur à chaque pas, quelle que soit sa rotation)
  if (e.fait === 'chasse') {
    const ecart = ecartDAngle(b.cap, Math.atan2(dyj, dxj))
    e.corps = { ...e.corps, cap: b.cap + Math.sign(ecart) * Math.min(Math.abs(ecart), c.ennemi.rotation * dt) }
  }
  // ses chocs lui coûtent des points, et abîment la roche
  for (const choc of r.chocs) {
    // (un choc contre une roche non plus — voir `horsArmeA`)
    e.horsArmeA = m.t
    e.pv -= coutDuChoc(c, choc, c.collision.degatsEnnemi)
    abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
  }
  return r.chocs
}

/**
 * Fait avancer LE MONDE de `dt` secondes : le joueur (et ses chocs), son laser qui vise le plus proche, roche ou
 * ennemi, les ennemis qui minent ou chassent, leurs traits, les roches qui éclatent, les pépites aimantées et
 * ramassées. Modifie `m` en place ; rend les chocs du joueur et ce qui s'est passé.
 */
/** Le bouclier du joueur est levé (il lui reste au moins un point) : ses chocs n'abîment pas ce qu'il heurte. */
const sousBouclier = (c: ConfigVaisseau, m: Monde): boolean => c.bouclier.points > 0 && m.bouclier >= c.uniteDeVie

/**
 * LES VAISSEAUX SE HEURTENT (Keko : « fais en sorte que les vaisseaux collident entre eux ») : le joueur et un rival qui
 * se recouvrent sont écartés à mi-chemin, et s'ils se rapprochaient, ils échangent leur vitesse normale (même masse,
 * amortie par le rebond) ; au-delà du seuil de choc, chacun prend des dégâts comme contre une roche — LE RIVAL N'EN
 * PREND PAS si le bouclier du joueur est levé (Keko : pas de bélier). Rend faux si la partie est perdue.
 */
function heurterLesVaisseaux(c: ConfigVaisseau, m: Monde, ev: Evenement[]): boolean {
  // (revenu, il passe au travers — voir `invasion.retour` ; déphasé, plus — voir `dephasage`)
  if (m.t < m.renaitJusque) return true
  const v = m.vaisseau
  // (TOUCHÉ, IL TRAVERSE LES INSECTES le temps qu'il clignote — Keko, 22/11 : « quand on est touché on est invincible un
  // court instant ; je voudrais qu'on traverse aussi les ennemis » — voir `invulnerabilite` ; les roches l'arrêtent encore)
  const traverse = c.invasion.active && m.t < m.intouchableJusque
  for (const e of [...m.ennemis]) {
    if (traverse && e.asteroide === undefined) continue
    const b = e.corps
    const dx = b.x - v.x
    const dy = b.y - v.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = c.rayon + rayonDe(c, e)
    if (d >= minimum) continue
    // (UNE ROCHE QUI DÉRIVE : bien plus lourde que lui — il rebondit sur elle, elle ne dévie pas ; un choc franc lui coûte
    // `derive.choc` unités de vie, la roche n'a rien)
    if (e.asteroide !== undefined) {
      const nx = dx / d
      const ny = dy / d
      v.x -= nx * (minimum - d)
      v.y -= ny * (minimum - d)
      const vn = (b.vx - v.vx) * nx + (b.vy - v.vy) * ny
      if (vn < 0) {
        v.vx += (1 + c.rebond) * vn * nx
        v.vy += (1 + c.rebond) * vn * ny
        if (-vn >= c.seuilChoc) encaisser(c, m, v.x + nx * c.rayon, v.y + ny * c.rayon, c.derive.choc * c.uniteDeVie, ev)
        if (m.phase !== 'vol') return false
      }
      continue
    }
    const nx = dx / d
    const ny = dy / d
    const recul = (minimum - d) / 2
    v.x -= nx * recul
    v.y -= ny * recul
    const vn = (b.vx - v.vx) * nx + (b.vy - v.vy) * ny
    let bx = b.x + nx * recul
    let by = b.y + ny * recul
    let bvx = b.vx
    let bvy = b.vy
    if (vn < 0) {
      const j = (-(1 + c.rebond) * vn) / 2
      v.vx -= j * nx
      v.vy -= j * ny
      bvx += j * nx
      bvy += j * ny
      const choc: Choc = { x: v.x + nx * c.rayon, y: v.y + ny * c.rayon, force: -vn, asteroide: -1 }
      const protege = sousBouclier(c, m)
      const contreJoueur = coutDuChoc(c, choc, c.collision.degatsCoque)
      if (contreJoueur > 0) encaisser(c, m, choc.x, choc.y, contreJoueur, ev)
      const contreRival = protege ? 0 : coutDuChoc(c, choc, c.collision.degatsEnnemi)
      if (contreRival > 0) {
        e.pv -= contreRival
        ev.push({ type: 'ennemiTouche', id: e.id, x: choc.x, y: choc.y, critique: false })
      }
    }
    e.corps = { ...b, x: bx, y: by, vx: bvx, vy: bvy }
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    if (m.phase !== 'vol') return false
  }
  return true
}

/**
 * Le joueur encaisse un coup. LE BOUCLIER EST DE LA VIE EN PLUS, DEVANT LA COQUE (Keko, 13/11 : « il peut être consommé
 * par des dégâts directement : si tu as 1 PV + 0,3 de bouclier et que tu prends 1 dégât, il te reste 0,3 PV ») : les
 * dégâts vident d'abord ce qu'il en reste, même une fraction en pleine recharge, et LE RESTE passe à la coque ; percée,
 * la partie est perdue. (Avant : un point entier de bouclier par coup, quel que soit le coup, et rien sous un point.)
 */
export function encaisser(c: ConfigVaisseau, m: Monde, x: number, y: number, degats: number, ev: Evenement[]): void {
  // (encore intouchable depuis le dernier coup : celui-ci ne compte pas)
  if (m.t < m.intouchableJusque) return
  m.toucheA = m.t
  let reste = degats
  if (c.bouclier.points > 0 && m.bouclier > 0) {
    const pris = Math.min(m.bouclier, reste)
    m.bouclier -= pris
    reste -= pris
    ev.push({ type: 'bouclier', x, y })
    // (LE BOUCLIER N'A PAS DE RÉPIT — Keko, 19/11 : « il ne faut pas que le bouclier bénéficie du clignotement et de
    // l'invincibilité après avoir été touché ; touché plusieurs fois d'affilée, il encaisse tous les dégâts ; l'invincibilité
    // ne concerne que le blindage » : tout bu par lui, le coup n'ouvre aucune invincibilité)
    if (reste <= 1e-9) return
  }
  // LE DÉPHASAGE (voir la configuration) : le coup qui atteindrait le blindage est annulé — sans invincibilité ni traversée
  // (`dephaseJusque` ne sert plus qu'au dessin)
  if (c.dephasage.chance > 0 && tire(m.graine, m.prochainId++, 31) < c.dephasage.chance) {
    m.dephaseJusque = m.t + c.dephasage.duree
    ev.push({ type: 'dephase', x, y })
    return
  }
  // (le coup passe au blindage — plaques, corruption, coque : l'invincibilité s'ouvre, il clignote)
  m.intouchableJusque = m.t + c.invulnerabilite
  // LES PLAQUES (voir la configuration) : la première encore debout prend le coup tout entier
  const k = m.plaques.indexOf(true)
  if (k >= 0) {
    m.plaques[k] = false
    m.plaqueCasseeA = m.t
    ev.push({ type: 'plaque', x, y, k })
    return
  }
  // LA CORRUPTION (voir la configuration) : le coup corrompt la part saine de la coque ; ce qui dépasse passe tout droit
  if (c.corruption.ronge > 0) {
    const pris = Math.min(Math.max(0, m.coque - m.corruption), reste)
    m.corruption += pris
    reste -= pris
    ev.push({ type: 'corrompu', x, y })
    if (reste <= 1e-9) return
  }
  m.coque -= reste
  m.corruption = Math.min(m.corruption, Math.max(0, m.coque))
  ev.push({ type: 'touche', x, y })
  if (m.coque <= 0) {
    m.coque = 0
    m.phase = 'perdu'
    if (c.invasion.active) m.invasion.retourA = m.t + c.invasion.penalite
    ev.push({ type: 'perdu' })
  }
}

/**
 * LE LANCE-FLAMMES crache : tout ennemi dans le cône, devant la bouche, jusqu'à la portée (plus son rayon), perd les
 * dégâts de l'arme par seconde et se met à brûler. Le cône suit le nez — c'est le nez qui se tourne vers la cible.
 */
function cracherLaFlamme(c: ConfigVaisseau, m: Monde, arme: Arme, fl: { cone: number; brulure: number; dpsBrulure: number; seul?: boolean }, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  const bo = arme.bouche
  const bx = bo === undefined ? v.x : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
  const by = bo === undefined ? v.y : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
  const dans = m.ennemis.filter((e) => {
    const d = Math.hypot(e.corps.x - bx, e.corps.y - by)
    if (d > arme.portee + rayonDe(c, e)) return false
    // (collé à la bouche, il est dedans quel que soit l'angle)
    return d <= rayonDe(c, e) + 1 || Math.abs(ecartDAngle(v.cap, Math.atan2(e.corps.y - by, e.corps.x - bx))) <= fl.cone
  })
  if (dans.length === 0) return
  m.crache = true
  // (LE CHALUMEAU ne brûle que la plus proche dans son faisceau)
  if (fl.seul === true) dans.splice(0, dans.length, dans.reduce((a, e) => (Math.hypot(e.corps.x - bx, e.corps.y - by) < Math.hypot(a.corps.x - bx, a.corps.y - by) ? e : a)))
  for (const e of dans) {
    e.pv -= arme.degats * dt
    brulerAuContact(c, m, e, fl.brulure, fl.dpsBrulure)
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LA CHAÎNE D'ÉCLAIRS ET L'AURA (voir `Arme.chaine`, `Arme.aura`). */
function mener_L_Electricite(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const au = a.aura
    if (au !== undefined)
      for (const e of [...m.ennemis]) {
        if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) > au.rayon + rayonDe(c, e)) continue
        // (elle électrocute ce qui est dedans ; ses dégâts, sans cesse, ne sont pas des coups directs : ils ne font pas sauter d'arc)
        if (a.electrocution !== undefined) electrocuter(c, m, e, a.electrocution, ev)
        e.pv -= au.dps * dt
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    const ch = a.chaine
    if (ch === undefined || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    let premiere: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) premiere = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (premiere = e)
      }
    }
    if (premiere === undefined) return
    m.armesA[i] = m.t + a.cadence
    const touches: Ennemi[] = [premiere]
    while (touches.length <= ch.rebonds) {
      const der = touches[touches.length - 1]
      let suiv: Ennemi | undefined
      let dc = ch.saut + c.ennemi.rayon
      for (const e of m.ennemis) {
        if (touches.includes(e)) continue
        const d = Math.hypot(e.corps.x - der.corps.x, e.corps.y - der.corps.y)
        if (d <= dc) (dc = d), (suiv = e)
      }
      if (suiv === undefined) break
      touches.push(suiv)
    }
    ev.push({ type: 'chaine', points: [{ x: v.x, y: v.y }, ...touches.map((e) => ({ x: e.corps.x, y: e.corps.y }))], ids: touches.map((e) => e.id) })
    touches.forEach((e, k) => {
      const critique = critiqueTire(c, m, a, e)
      effetsDuCoup(c, m, a, e, ev)
      e.pv -= (a.degats * Math.pow(ch.attenuation, k)) * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    })
  })
}

/** LES SCIES (voir `Arme.scie`) : le lancer, l'aller qui ralentit, le retour qui vire vers le vaisseau, les coupes. */
function menerLesScies(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sc = a.scie
    if (sc === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0) || m.scies.some((s) => s.arme === i)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    // (elle part du bord du vaisseau — ou de son lance-scie, à la proue, s'il en a un : `bouche` —, à la vitesse qui la
    // fait s'arrêter pile à `portee` : 2 × portée ÷ aller)
    const b = a.bouche === undefined ? null : boucheDansLeMonde(v, a)
    const cap0 = Math.atan2(cible.corps.y - (b?.y ?? v.y), cible.corps.x - (b?.x ?? v.x))
    const x0 = b?.x ?? v.x + Math.cos(cap0) * (c.rayon + 2)
    const y0 = b?.y ?? v.y + Math.sin(cap0) * (c.rayon + 2)
    const v0 = (2 * (a.portee - c.rayon - 2)) / sc.aller
    m.scies.push({ id: m.prochainId++, arme: i, x: x0, y: y0, vx: Math.cos(cap0) * v0, vy: Math.sin(cap0) * v0, cap0, lancee: m.t, revient: false, touches: [] })
    ev.push({ type: 'scieLancee', x: x0, y: y0, arme: a.id })
  })
  for (let k = m.scies.length - 1; k >= 0; k--) {
    const s = m.scies[k]
    const a = c.armes[s.arme]
    const sc = a?.scie
    if (a === undefined || sc === undefined) {
      m.scies.splice(k, 1)
      continue
    }
    const age = m.t - s.lancee
    if (!s.revient) {
      // L'ALLER : droit, de plus en plus lent ; arrêtée, elle revient — et peut retoucher ceux de l'aller
      const vit = ((2 * (a.portee - c.rayon - 2)) / sc.aller) * Math.max(0, 1 - age / sc.aller)
      s.vx = Math.cos(s.cap0) * vit
      s.vy = Math.sin(s.cap0) * vit
      if (age >= sc.aller) (s.revient = true), (s.touches = [])
    } else {
      // LE RETOUR : elle vire vers le vaisseau, là où il est maintenant, et accélère jusqu'à `retour`
      const dx = v.x - s.x
      const dy = v.y - s.y
      const d = Math.hypot(dx, dy) || 1
      const voulue = sc.retour * Math.min(1, (age - sc.aller) / 0.25)
      const k2 = Math.min(1, sc.virage * dt)
      s.vx += ((dx / d) * voulue - s.vx) * k2
      s.vy += ((dy / d) * voulue - s.vy) * k2
    }
    s.x += s.vx * dt
    s.y += s.vy * dt
    // LES COUPES : une fois par insecte et par sens
    for (const e of [...m.ennemis]) {
      if (s.touches.includes(e.id) || Math.hypot(e.corps.x - s.x, e.corps.y - s.y) > sc.rayon + rayonDe(c, e)) continue
      s.touches.push(e.id)
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    // LA RÉCEPTION : au contact du vaisseau, au retour (ou, perdue trop longtemps, elle rentre d'elle-même)
    if ((s.revient && Math.hypot(v.x - s.x, v.y - s.y) <= c.rayon + 3) || age > sc.aller + 6) {
      m.scies.splice(k, 1)
      m.armesA[s.arme] = m.t + a.cadence
      ev.push({ type: 'scieRattrapee', x: s.x, y: s.y })
    }
  }
}

/** LE GIVRE (voir `Arme.givre`) : la traînée semée derrière le vaisseau, les insectes qu'elle ralentit et ronge. */
function menerLeGivre(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  m.givres = m.givres.filter((g) => m.t - g.nee < g.duree)
  c.armes.forEach((a, i) => {
    const gi = a.givre
    if (gi === undefined || m.phase !== 'vol') return
    // (DERRIÈRE LUI : à l'opposé de sa vitesse, au bord de la coque ; à l'arrêt, sous lui)
    const vit = Math.hypot(v.vx, v.vy)
    const x = vit > 5 ? v.x - (v.vx / vit) * c.rayon : v.x
    const y = vit > 5 ? v.y - (v.vy / vit) * c.rayon : v.y
    let derniere: Givre | undefined
    for (const g of m.givres) if (g.arme === i) derniere = g
    if (derniere !== undefined && Math.hypot(derniere.x - x, derniere.y - y) < gi.ecart) return
    m.givres.push({ id: m.prochainId++, arme: i, x, y, nee: m.t, rayon: gi.rayon, duree: gi.duree, dps: gi.dps, ralenti: gi.ralenti, ...(gi.poison === true ? { poison: true } : {}), ...(gi.corrosion !== undefined ? { corrosion: gi.corrosion } : {}) })
  })
  if (m.givres.length === 0) return
  for (const e of [...m.ennemis]) {
    // (la plaque qui ralentit le plus, s'il y en a plusieurs ; ses dégâts une fois, pas une fois par plaque — le poison à
    // part : un insecte dans du givre et du poison prend les deux)
    let pire: Givre | undefined
    let venin: Givre | undefined
    for (const g of m.givres) {
      if (Math.hypot(e.corps.x - g.x, e.corps.y - g.y) > g.rayon + rayonDe(c, e) * 0.5) continue
      if (g.poison === true) {
        if (venin === undefined || g.dps > venin.dps) venin = g
      } else if (pire === undefined || g.ralenti < pire.ralenti) pire = g
    }
    if (venin !== undefined) {
      e.poisonA = m.t + 0.4
      e.pv -= venin.dps * dt
      // (LA TRAÎNÉE CORROSIVE RONGE : qui y est est vulnérable — voir `ronger`)
      if (venin.corrosion !== undefined) ronger(c, m, e, { duree: venin.corrosion.duree, dps: 0, bonus: venin.corrosion.bonus }, ev)
    }
    if (pire !== undefined) {
      geler(c, m, e, 0.25, pire.ralenti, ev)
      e.pv -= pire.dps * dt
    }
    if (pire === undefined && venin === undefined) continue
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LES NOVAS DE GIVRE (voir `Arme.nova`) : l'onde qui frappe et gèle tout autour, la plaque de verglas qu'elle laisse. */
function lancerLesNovas(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const nv = a.nova
    if (nv === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (… MÊME SANS PERSONNE AUTOUR — Keko, 19/11 : « lancer la nova de givre même quand il n'y a pas d'ennemis » : elle
    // part à chaque cadence, et sa plaque de verglas attend)
    m.armesA[i] = m.t + a.cadence
    ev.push({ type: 'nova', x: v.x, y: v.y, rayon: nv.rayon })
    m.givres.push({ id: m.prochainId++, arme: i, x: v.x, y: v.y, nee: m.t, rayon: nv.plaque.rayon, duree: nv.plaque.duree, dps: nv.plaque.dps, ralenti: nv.plaque.ralenti, verglas: true })
    m.novas.push({ arme: i, x: v.x, y: v.y, nee: m.t, frappes: [] })
  })
  // (l'onde s'ouvre — vite d'abord, puis elle se pose, la même courbe qu'à l'écran — et frappe ce que son front atteint)
  for (let k = m.novas.length - 1; k >= 0; k--) {
    const o = m.novas[k]
    const a = c.armes[o.arme]
    const nv = a?.nova
    const ouverture = nv?.ouverture ?? 0.35
    if (nv === undefined || m.t - o.nee > ouverture + 1e-9) {
      m.novas.splice(k, 1)
      if (nv === undefined) continue
    }
    const front = frontDeLaNova(nv.rayon, m.t - o.nee, ouverture)
    for (const e of m.ennemis) {
      if (o.frappes.includes(e.id) || e.pv <= 0) continue
      if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > front + rayonDe(c, e)) continue
      o.frappes.push(e.id)
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      geler(c, m, e, nv.gel.duree, nv.gel.ralenti, ev, true)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}
/** Le front d'une onde de nova de `rayon`, `age` secondes après son départ, ouverte en `ouverture` : vite, puis posé. */
export function frontDeLaNova(rayon: number, age: number, ouverture = 0.35): number {
  return rayon * (1 - Math.pow(1 - Math.min(1, Math.max(0, age) / ouverture), 3))
}

/** GELER un insecte (le givre, un éclat de glace) : `duree` secondes, à `ralenti` de sa vitesse — le gel le plus fort l'emporte. */
/**
 * LA DURÉE D'UN ÉTAT (voir `ConfigVaisseau.dureeDesEtats`) : au vortex, 6 s, quelle que soit la source — d'un tir, d'un
 * rayon, d'une flaque, d'une zone, d'une mine, de 0,25 à 4 s chacune avant — ; ailleurs, celle de la source. Un nouveau coup
 * remet le compte ; une source qui ne brûle pas (`brulure` 0) ne brûle toujours pas.
 */
const dureeDEtat = (c: ConfigVaisseau, duree: number): number => (c.dureeDesEtats > 0 ? c.dureeDesEtats : duree)
function geler(c: ConfigVaisseau, m: Monde, e: Ennemi, duree: number, ralenti: number, ev: Evenement[], coup = false): void {
  const deja = (e.geleA ?? -1) > m.t
  // (« GEL PROFOND » : un COUP de givre — pas une zone qui gèle sans cesse — sur un insecte qui l'était déjà ; voir `ELEMENTAIRES`)
  if (coup && deja && c.elementaires.gelure && e.asteroide === undefined && tire(m.graine, m.prochainId++, 99) < ELEMENTAIRES.gelure.chance * (1 + c.renforts.givre)) figer(m, e, ELEMENTAIRES.gelure.duree, 'glace', ev)
  if (!deja) ev.push({ type: 'gele', id: e.id, x: e.corps.x, y: e.corps.y })
  e.ralenti = deja ? Math.min(e.ralenti ?? 1, ralenti) : ralenti
  e.geleA = Math.max(e.geleA ?? -1, m.t + dureeDEtat(c, duree))
}
/** IL BRÛLE (une flamme, un rayon, une traînée, une flaque) : `brulure` secondes à `dps` (voir `dureeDEtat`), si la source brûle. */
function brulerAuContact(c: ConfigVaisseau, m: Monde, e: Ennemi, brulure: number, dps: number): void {
  if (brulure <= 0) return
  const d = dureeDEtat(c, brulure)
  e.bruleA = m.t + d
  e.dpsBrulure = brulureDEtat(c, dps)
  e.dureeBrulure = d
}
/** CE QU'UNE BRÛLURE FAIT PAR SECONDE (voir `ConfigVaisseau.brulureDesEtats`) : au vortex, la même partout ; ailleurs, celle de la source. */
const brulureDEtat = (c: ConfigVaisseau, dps: number): number => (c.brulureDesEtats > 0 ? c.brulureDesEtats : dps)

/** LES TORNADES DE GIVRE (voir `Arme.tornade`) : le départ, la poursuite, la zone qui gèle et ronge, la fin. */
function menerLesTornades(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const to = a.tornade
    if (to === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    let cible: Ennemi | undefined
    let dc = a.portee + c.ennemi.rayon
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      if (d <= dc) (dc = d), (cible = e)
    }
    // (… MÊME SANS PERSONNE À PORTÉE — Keko, 19/11 : « lancer les tempêtes de givre même quand il n'y a pas d'ennemis » :
    // elle part droit devant le nez, et chasse le premier insecte qui paraît)
    m.armesA[i] = m.t + a.cadence
    const an = cible === undefined ? v.cap : Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    m.tornades.push({ id: m.prochainId++, arme: i, x: v.x, y: v.y, vx: Math.cos(an) * to.vitesse, vy: Math.sin(an) * to.vitesse, nee: m.t })
    ev.push({ type: 'tornade', x: v.x, y: v.y, arme: a.id })
  })
  for (let k = m.tornades.length - 1; k >= 0; k--) {
    const tn = m.tornades[k]
    const to = c.armes[tn.arme]?.tornade
    if (to === undefined || m.t - tn.nee >= to.duree) {
      m.tornades.splice(k, 1)
      ev.push({ type: 'tornadeFinie', x: tn.x, y: tn.y })
      continue
    }
    // ELLE SUIT : le verrouillé d'abord, sinon l'insecte le plus proche d'elle ; personne, elle file droit
    let cible = ennemiVerrouille(m) ?? undefined
    if (cible === undefined) {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - tn.x, e.corps.y - tn.y)
        if (d < dc) (dc = d), (cible = e)
      }
    }
    if (cible !== undefined) {
      const dx = cible.corps.x - tn.x
      const dy = cible.corps.y - tn.y
      const d = Math.hypot(dx, dy)
      if (d < to.rayon) {
        // (SUR LUI : elle va droit dessus et freine — elle se pose sur l'insecte au lieu de le dépasser en boucles)
        const vit = Math.min(to.vitesse, d * 5)
        tn.vx = d > 0.01 ? (dx / d) * vit : 0
        tn.vy = d > 0.01 ? (dy / d) * vit : 0
      } else {
        // (de loin, elle vire vers lui, de `virage` par seconde au plus : sa course s'incurve)
        const vit = Math.max(Math.hypot(tn.vx, tn.vy), to.vitesse * 0.3)
        const cap = Math.atan2(tn.vy, tn.vx)
        const ecart = ecartDAngle(cap, Math.atan2(dy, dx))
        const nc = cap + Math.sign(ecart) * Math.min(Math.abs(ecart), to.virage * dt)
        const nv = Math.min(to.vitesse, vit + to.vitesse * 2 * dt)
        tn.vx = Math.cos(nc) * nv
        tn.vy = Math.sin(nc) * nv
      }
    }
    tn.x += tn.vx * dt
    tn.y += tn.vy * dt
    // LA ZONE : ce qui est dedans est gelé et rongé
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - tn.x, e.corps.y - tn.y) > to.rayon + rayonDe(c, e) * 0.5) continue
      geler(c, m, e, 0.25, to.ralenti, ev)
      e.pv -= to.dps * dt
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}

/** LES SALVES (voir `Arme.salve`) : à la cadence, un insecte à portée, `nombre` obus à angles égaux autour du vaisseau. */
function tirerLesSalves(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sa = a.salve
    if (sa === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (LA COURONNE S'ORIENTE : le premier éclat vers la cible — la verrouillée à portée, sinon la plus proche)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const cap0 = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    for (let k = 0; k < sa.nombre; k++) {
      const an = cap0 + (k * 2 * Math.PI) / sa.nombre
      const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, m.prochainId, 12) < chanceDeCritique(c, a)
      m.obus.push({ id: m.prochainId++, x: v.x + Math.cos(an) * (c.rayon + 2), y: v.y + Math.sin(an) * (c.rayon + 2), vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: false, arme: a.id, critique, ...(a.gel === undefined ? {} : { gel: a.gel }), ...(sa.perce === true ? { perce: [] } : {}), ...(sa.eclatement === undefined ? {} : { eclatement: sa.eclatement }) })
    }
    ev.push({ type: 'salve', x: v.x, y: v.y, arme: a.id })
  })
}

/** Où est une écharde de givre (voir `Arme.condense`) : sa place sur son cercle, qui tourne lentement autour du vaisseau. */
export function placeDeLEcharde(c: ConfigVaisseau, m: Monde, e: Monde['echardes'][number]): { x: number; y: number; an: number } {
  const cd = c.armes[e.arme]?.condense
  const an = (e.place / (cd?.max ?? 5)) * Math.PI * 2 + m.t * 0.7
  const r = cd?.rayon ?? 16
  return { x: m.vaisseau.x + Math.cos(an) * r, y: m.vaisseau.y + Math.sin(an) * r, an }
}
/** LES ÉCHARDES DE GIVRE (voir `Arme.condense`) : elles se forment, attendent, et partent en rafale vers les insectes à portée. */
function condenserLesEchardes(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const cd = a.condense
    if (cd === undefined || m.phase !== 'vol') return
    const miennes = m.echardes.filter((e) => e.arme === i)
    // (la formation : une place libre ; pleines, l'horloge attend — la suivante viendra `cadence` après un départ)
    if (miennes.length >= cd.max) m.armesA[i] = Math.max(m.armesA[i] ?? 0, m.t + a.cadence)
    else if (m.t >= (m.armesA[i] ?? 0)) {
      const prises = new Set(miennes.map((e) => e.place))
      let place = 0
      while (prises.has(place)) place++
      const e = { id: m.prochainId++, arme: i, nee: m.t, place }
      m.echardes.push(e)
      miennes.push(e)
      m.armesA[i] = m.t + a.cadence
      const pe = placeDeLEcharde(c, m, e)
      ev.push({ type: 'condensation', x: pe.x, y: pe.y })
    }
    // (les cibles : à portée, le verrouillé d'abord, puis du plus proche au plus lointain)
    const ve = ennemiVerrouille(m)
    const cibles = m.ennemis
      .filter((e) => e.pv > 0 && Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e))
      .sort((p, q) => (p === ve ? -1 : q === ve ? 1 : Math.hypot(p.corps.x - v.x, p.corps.y - v.y) - Math.hypot(q.corps.x - v.x, q.corps.y - v.y)))
    // (la rafale : toutes les prêtes, l'une après l'autre)
    if (cibles.length > 0 && !miennes.some((e) => e.depart !== undefined)) {
      const pretes = miennes.filter((e) => m.t - e.nee >= cd.apparition).sort((p, q) => p.place - q.place)
      pretes.forEach((e, k) => {
        e.depart = m.t + k * cd.intervalle
        e.rang = k
      })
    }
    for (const e of miennes) {
      if (e.depart === undefined || m.t < e.depart) continue
      // (plus personne à portée : elle reste, et attendra la prochaine rafale)
      if (cibles.length === 0) {
        delete e.depart
        continue
      }
      const cible = cibles[(e.rang ?? 0) % cibles.length]
      const p = placeDeLEcharde(c, m, e)
      m.echardes.splice(m.echardes.indexOf(e), 1)
      const an = Math.atan2(cible.corps.y - p.y, cible.corps.x - p.x)
      const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, m.prochainId, 12) < chanceDeCritique(c, a)
      m.obus.push({ id: m.prochainId++, x: p.x, y: p.y, vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: false, arme: a.id, critique, verrou: cible.id, ...(a.gel === undefined ? {} : { gel: a.gel }) })
      ev.push({ type: 'echarde', x: p.x, y: p.y, arme: a.id })
    }
  })
}

/** LES ESSAIMS (voir `Arme.essaim`) : à la cadence, un insecte à portée, `nombre` missiles, chacun sa cible tirée au hasard (le verrouillé pour tous). */
function tirerLesEssaims(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const es = a.essaim
    if (es === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    const ve = ennemiVerrouille(m)
    const cibles = ve !== null && aPortee(ve) ? [ve] : m.ennemis.filter(aPortee)
    if (cibles.length === 0) return
    m.armesA[i] = m.t + a.cadence
    const bo = a.bouche
    const x0 = bo === undefined ? v.x : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
    const y0 = bo === undefined ? v.y : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
    // (LES MISSILES SE DISTRIBUENT — Keko, 16/11 : « pas tous les missiles sur une même cible : on prend toutes les cibles
    // à portée et on leur attribue les missiles un par un, au hasard » : tirés chacun de son côté, plusieurs tombaient sur
    // le même insecte ; les insectes à portée sont MÉLANGÉS, et chacun reçoit un missile avant qu'un autre en ait deux)
    const ordre: Ennemi[] = []
    for (let tour = 0; ordre.length < es.nombre; tour++) {
      const paquet = [...cibles]
      for (let j = paquet.length - 1; j > 0; j--) {
        const r = Math.min(j, Math.floor(tire(m.graine, m.prochainId, 22, tour * 64 + j) * (j + 1)))
        ;[paquet[j], paquet[r]] = [paquet[r], paquet[j]]
      }
      ordre.push(...paquet)
    }
    for (let k = 0; k < es.nombre; k++) {
      const id = m.prochainId++
      const cible = ordre[k]
      // (il part dans une direction tirée au hasard, à ±`eventail` de sa cible)
      const an = Math.atan2(cible.corps.y - y0, cible.corps.x - x0) + (tire(m.graine, id, 23) - 0.5) * 2 * es.eventail
      const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, id, 12) < chanceDeCritique(c, a)
      m.obus.push({ id, x: x0, y: y0, vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: false, arme: a.id, critique, ...effetsDuTir(a), traque: { cible: cible.id, nee: m.t, v0: a.vitesse, acces: es.acces, pointe: es.pointe, braquage: es.braquage, chaos: es.chaos, pas: es.pas * (0.7 + 0.6 * tire(m.graine, id, 24)), calme: es.calme, reprise: es.reprise } })
    }
    ev.push({ type: 'essaim', x: x0, y: y0, arme: a.id })
  })
}

/** La bouche d'une arme, dans le monde (sans bouche : le centre du vaisseau). */
export function boucheDansLeMonde(v: Vaisseau, a: Arme): Vecteur {
  const bo = a.bouche
  return bo === undefined ? { x: v.x, y: v.y } : { x: v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y, y: v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y }
}

/** LES SPHÈRES DE PLASMA (voir `Arme.sphere`) : le lancer, le vol tout droit, les petits tirs sur les insectes proches, l'extinction. */
/** LE RAYON DE L'ANNEAU D'UNE BOULE MAGNÉTIQUE (voir `Arme.sphere.magnetisme`), `age` secondes après sa naissance : il part du bord, se referme de plus en plus vite sur elle, et renaît au bord. */
export function anneauMagnetique(mg: { rayon: number; periode: number }, age: number): number {
  const u = (Math.max(0, age) % mg.periode) / mg.periode
  return mg.rayon * (1 - u * u)
}

function menerLesSpheres(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sp = a.sphere
    if (sp === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const b = boucheDansLeMonde(v, a)
    const cap = Math.atan2(cible.corps.y - b.y, cible.corps.x - b.x)
    m.spheres.push({ id: m.prochainId++, arme: i, x: b.x, y: b.y, vx: Math.cos(cap) * sp.vitesse, vy: Math.sin(cap) * sp.vitesse, nee: m.t, tirA: m.t + sp.periode * 0.5 })
    ev.push({ type: 'sphere', x: b.x, y: b.y, arme: a.id })
  })
  for (let k = m.spheres.length - 1; k >= 0; k--) {
    const s = m.spheres[k]
    const a = c.armes[s.arme]
    const sp = a?.sphere
    if (a === undefined || sp === undefined || m.t - s.nee >= sp.duree) {
      m.spheres.splice(k, 1)
      ev.push({ type: 'sphereFinie', x: s.x, y: s.y })
      continue
    }
    const x0 = s.x
    const y0 = s.y
    s.x += s.vx * dt
    s.y += s.vy * dt
    // (HAUTE TENSION : sa course laisse une traînée électrique — voir `Arme.sphere.trainee` ; un bout tous les 4 au moins,
    // pour que l'éclair ait de quoi serpenter)
    const tr = sp.trainee
    if (tr !== undefined && m.phase === 'vol') {
      let si = m.sillons.find((x) => x.balle === s.id)
      if (si === undefined) {
        // (`largeur` 0 : TOUTE LA ZONE DE LA BOULE — Keko, 24/11 : « une traînée dont la largeur est égale à la zone totale de la
        // bobine ; beaucoup moins de dégâts, mais beaucoup plus large » : son rayon, Grande bobine et cartes « Portée » comprises)
        si = { parSegment: true, balle: s.id, segments: [], nee: m.t, duree: tr.duree, dps: tr.dps, largeur: tr.largeur > 0 ? tr.largeur : sp.rayon, ...(a.electrocution === undefined ? {} : { electrocution: a.electrocution }) }
        m.sillons.push(si)
      }
      const der = si.segments[si.segments.length - 1]
      if (der !== undefined && Math.hypot(der.x1 - der.x0, der.y1 - der.y0) < 4 && m.t - (der.t ?? m.t) < 0.2) (der.x1 = s.x), (der.y1 = s.y)
      else si.segments.push({ x0: der?.x1 ?? x0, y0: der?.y1 ?? y0, x1: s.x, y1: s.y, t: m.t })
    }
    // (MAGNÉTISME : son anneau se referme, emporte les cristaux et pousse les insectes vers elle — voir `Arme.sphere.magnetisme`)
    const mg = sp.magnetisme
    if (mg !== undefined && m.phase === 'vol') {
      const age = m.t - s.nee
      const ici = anneauMagnetique(mg, age)
      const avant = anneauMagnetique(mg, Math.max(0, age - dt))
      // (le balayage de ce pas : de `avant` à `ici` ; un anneau qui renaît au bord ne balaie rien)
      const balaye = (d: number): boolean => ici < avant && d <= avant && d >= ici
      // (UNE IMPULSION PAR TOUR : poussé, l'insecte était rattrapé par l'anneau à l'image suivante, et emporté jusqu'à la
      // boule — mesuré, 44 en une seconde)
      const tour = Math.floor(Math.max(0, age) / mg.periode)
      if (s.tour !== tour) (s.tour = tour), (s.pousses = [])
      for (const e of m.ennemis) {
        if (e.asteroide !== undefined) continue
        const dx = s.x - e.corps.x
        const dy = s.y - e.corps.y
        const d = Math.hypot(dx, dy)
        if (d < 1 || s.pousses!.includes(e.id) || (!balaye(d - rayonDe(c, e)) && !balaye(d))) continue
        s.pousses!.push(e.id)
        // (UN PETIT BOND vers elle, pas un élan : la pointe d'un insecte l'aurait bu à l'image suivante — mesuré, le test ne
        // le voyait pas bouger ; jamais jusque dans la boule)
        const pas = Math.min(mg.impulsion, Math.max(0, d - rayonDe(c, e) - 2))
        e.corps = { ...e.corps, x: e.corps.x + (dx / d) * pas, y: e.corps.y + (dy / d) * pas }
      }
      // (LES CRISTAUX : touchés, emportés avec l'anneau ; au centre, ils comptent en expérience — Keko, 24/11 : « ajoutés à
      // l'XP, pas envoyés sur le vaisseau » ; ni les plaques, ni les soins, ni l'aimant, ni ceux que le vaisseau aimante déjà ;
      // l'expérience n'est qu'au vortex : ailleurs, les cristaux sont du minerai, ils restent au vaisseau)
      for (let n = c.invasion.active ? m.pepites.length - 1 : -1; n >= 0; n--) {
        const q = m.pepites[n]
        if (q.aimanteeA !== undefined || q.aimant === true || q.plaque === true || q.soin === true) continue
        const dx = q.x - s.x
        const dy = q.y - s.y
        const d = Math.hypot(dx, dy)
        if (q.emportee !== s.id) {
          if (q.emportee !== undefined || !balaye(d)) continue
          q.emportee = s.id
        }
        // (l'anneau renaît au bord, ou il a atteint la boule : le cristal compte)
        if (ici >= avant || ici <= 3 || d <= 3) {
          m.pepites.splice(n, 1)
          gagnerLaPepite(c, m, q, ev)
          ev.push({ type: 'ramasse', x: s.x, y: s.y, par: 'joueur', minerai: q.minerai })
          continue
        }
        const r = Math.min(d, ici)
        q.x = s.x + (d > 0 ? (dx / d) * r : 0)
        q.y = s.y + (d > 0 ? (dy / d) * r : 0)
        q.vx = 0
        q.vy = 0
      }
    }
    if (m.t < s.tirA) continue
    s.tirA = m.t + sp.periode
    // (LA FOUDRE : les plus proches dans son rayon, frappés à l'instant — voir `Arme.sphere.foudre`)
    if (sp.foudre !== undefined) {
      const proches = m.ennemis.filter((e) => Math.hypot(e.corps.x - s.x, e.corps.y - s.y) <= sp.rayon + rayonDe(c, e)).sort((e1, e2) => Math.hypot(e1.corps.x - s.x, e1.corps.y - s.y) - Math.hypot(e2.corps.x - s.x, e2.corps.y - s.y)).slice(0, sp.foudre.cibles)
      // (un éclair : de `de` à `e`, `part` de ses dégâts)
      const frapper = (e: Ennemi, de: { x: number; y: number }, part: number): void => {
        const critique = critiqueTire(c, m, a, e)
        effetsDuCoup(c, m, a, e, ev)
        e.pv -= a.degats * (1 + (s.charge ?? 0)) * part * (critique ? facteurSur(c, m, a, e) : 1)
        // (ACCUMULATEUR : un critique la charge pour la suite — voir `Arme.sphere.accumulateur`)
        if (critique && sp.accumulateur !== undefined) {
          s.charge = (s.charge ?? 0) + sp.accumulateur
          ev.push({ type: 'sphereChargee', x: s.x, y: s.y, charge: s.charge })
        }
        ev.push({ type: 'foudre', x0: de.x, y0: de.y, x1: e.corps.x, y1: e.corps.y })
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
      const rb = sp.foudre.rebonds
      for (const e of proches) {
        frapper(e, s, 1)
        // (CONDUCTION : puis il saute d'ennemi en ennemi — voir `Arme.sphere.foudre.rebonds`)
        if (rb === undefined) continue
        const chaine = new Set<Ennemi>([e])
        let der = { x: e.corps.x, y: e.corps.y }
        for (let k = 1; k <= rb.n; k++) {
          let suiv: Ennemi | undefined
          let dc = Infinity
          for (const o of m.ennemis) {
            if (chaine.has(o) || o.asteroide !== undefined) continue
            const d = Math.hypot(o.corps.x - der.x, o.corps.y - der.y)
            if (d <= rb.saut + rayonDe(c, o) && d < dc) (dc = d), (suiv = o)
          }
          if (suiv === undefined) break
          chaine.add(suiv)
          const ici = { x: suiv.corps.x, y: suiv.corps.y }
          frapper(suiv, der, Math.pow(rb.attenuation, k))
          der = ici
        }
      }
      if (proches.length > 0) ev.push({ type: 'sphereTir', x: s.x, y: s.y, tirs: proches.length })
      continue
    }
    // (un petit trait sur CHAQUE insecte à portée d'elle : il part vers lui, un peu de travers, et le rattrape en zigzaguant)
    let tirs = 0
    for (const e of m.ennemis) {
      if (Math.hypot(e.corps.x - s.x, e.corps.y - s.y) > sp.rayon + rayonDe(c, e)) continue
      const id = m.prochainId++
      const an = Math.atan2(e.corps.y - s.y, e.corps.x - s.x) + (tire(m.graine, id, 23) - 0.5) * 1.6
      const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, id, 12) < chanceDeCritique(c, a)
      m.obus.push({ id, x: s.x, y: s.y, vx: Math.cos(an) * sp.vitesseTir, vy: Math.sin(an) * sp.vitesseTir, vie: 1, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: false, arme: 'arcane', critique, traque: { cible: e.id, nee: m.t, v0: sp.vitesseTir, acces: 200, pointe: 260, braquage: 14, chaos: 0.9, pas: 0.09, calme: 0.3, reprise: 20 } })
      tirs++
    }
    if (tirs > 0) ev.push({ type: 'sphereTir', x: s.x, y: s.y, tirs })
  }
}

/** LES MÉTÉORES D'ARCANE (voir `Arme.meteore`) : le choix de l'insecte, la chute qui le suit, l'impact. */
function menerLesMeteores(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const me = a.meteore
    if (me === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const d = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    let cible = ennemiVerrouille(m)
    if (cible === null || d(cible) > a.portee + c.ennemi.rayon) {
      cible = null
      for (const e of m.ennemis) if (d(e) <= a.portee + rayonDe(c, e) && (cible === null || d(e) < d(cible))) cible = e
    }
    if (cible === null) return
    m.armesA[i] = m.t + a.cadence
    const id = m.prochainId++
    m.meteores.push({ id, arme: i, cible: cible.id, x: cible.corps.x, y: cible.corps.y, lancee: m.t, tombe: m.t + me.chute })
    const b = boucheDansLeMonde(v, a)
    ev.push({ type: 'meteore', id, x: cible.corps.x, y: cible.corps.y, arme: a.id, x0: b.x, y0: b.y })
  })
  for (let k = m.meteores.length - 1; k >= 0; k--) {
    const mt = m.meteores[k]
    const a = c.armes[mt.arme]
    const me = a?.meteore
    if (a === undefined || me === undefined) {
      m.meteores.splice(k, 1)
      continue
    }
    // (le point de chute suit son insecte tant qu'il vit)
    const e0 = m.ennemis.find((e) => e.id === mt.cible)
    if (e0 !== undefined) (mt.x = e0.corps.x), (mt.y = e0.corps.y)
    if (m.t < mt.tombe) continue
    m.meteores.splice(k, 1)
    ev.push({ type: 'meteoreImpact', id: mt.id, x: mt.x, y: mt.y })
    // (elle ne frappe QUE son insecte — plus de zone d'effet)
    if (e0 !== undefined) {
      const e = e0
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}

/** LES PUITS DE PLASMA (voir `Arme.puits`) : le lancer au cœur de la nuée, le vol, l'aspiration, l'éclat. */
function menerLesPuits(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const pu = a.puits
    if (pu === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    // (au cœur de la nuée : l'insecte qui a le plus de voisins dans le rayon du puits ; le verrouillé d'abord)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let meilleur = -1
      for (const e of m.ennemis) {
        if (!aPortee(e)) continue
        const n = m.ennemis.filter((o) => Math.hypot(o.corps.x - e.corps.x, o.corps.y - e.corps.y) <= pu.rayon).length
        if (n > meilleur) (meilleur = n), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const b = boucheDansLeMonde(v, a)
    const { x, y } = cible.corps
    m.puits.push({ id: m.prochainId++, arme: i, x0: b.x, y0: b.y, cx: b.x, cy: b.y, x, y, lance: m.t, arrive: m.t + Math.hypot(x - b.x, y - b.y) / pu.vitesse, ouvert: false })
    ev.push({ type: 'puits', x: b.x, y: b.y, arme: a.id })
  })
  for (let k = m.puits.length - 1; k >= 0; k--) {
    const p = m.puits[k]
    const a = c.armes[p.arme]
    const pu = a?.puits
    if (a === undefined || pu === undefined) {
      m.puits.splice(k, 1)
      continue
    }
    if (!p.ouvert) {
      const u = Math.min(1, (m.t - p.lance) / Math.max(1e-6, p.arrive - p.lance))
      p.cx = p.x0 + (p.x - p.x0) * u
      p.cy = p.y0 + (p.y - p.y0) * u
      if (u < 1) continue
      p.ouvert = true
      ev.push({ type: 'puitsOuvert', x: p.x, y: p.y, rayon: pu.rayon })
    }
    // (OUVERT : il tire vers son centre ce qui est dans son rayon — sans le dépasser)
    for (const e of m.ennemis) {
      const dx = p.x - e.corps.x
      const dy = p.y - e.corps.y
      const d = Math.hypot(dx, dy)
      if (d > pu.rayon + rayonDe(c, e) || d < 1e-6) continue
      const pas = Math.min(d, pu.force * dt)
      e.corps = { ...e.corps, x: e.corps.x + (dx / d) * pas, y: e.corps.y + (dy / d) * pas }
    }
    if (m.t < p.arrive + pu.duree) continue
    // (L'ÉCLAT : tout ce qui est près du centre)
    m.puits.splice(k, 1)
    ev.push({ type: 'puitsEclate', x: p.x, y: p.y, rayon: pu.eclat })
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - p.x, e.corps.y - p.y) > pu.eclat + rayonDe(c, e)) continue
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}

/** LES RAILGUNS (voir `Arme.rail`) : à la cadence, un insecte à portée, le trait instantané — sur la ligne qui en traverse le plus. */
function tirerLesRails(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const ra = a.rail
    if (ra === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const b = boucheDansLeMonde(v, a)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - b.x, e.corps.y - b.y) <= a.portee + rayonDe(c, e)
    const enVue = m.ennemis.filter(aPortee)
    if (enVue.length === 0) return
    // (ceux que traverse la ligne de la bouche, dans la direction `an`, sur toute la portée)
    const traverses = (an: number): Ennemi[] => {
      const ux = Math.cos(an)
      const uy = Math.sin(an)
      return m.ennemis.filter((e) => {
        const ex = e.corps.x - b.x
        const ey = e.corps.y - b.y
        const le = ex * ux + ey * uy
        return le >= -rayonDe(c, e) && le <= a.portee + rayonDe(c, e) && Math.abs(ex * uy - ey * ux) <= ra.largeur + rayonDe(c, e)
      })
    }
    const ve = ennemiVerrouille(m)
    let an: number
    if (ve !== null && aPortee(ve)) an = Math.atan2(ve.corps.y - b.y, ve.corps.x - b.x)
    else {
      let meilleur = -1
      let dc = Infinity
      an = 0
      for (const e of enVue) {
        const a0 = Math.atan2(e.corps.y - b.y, e.corps.x - b.x)
        const n = traverses(a0).length
        const d = Math.hypot(e.corps.x - b.x, e.corps.y - b.y)
        if (n > meilleur || (n === meilleur && d < dc)) (meilleur = n), (dc = d), (an = a0)
      }
    }
    m.armesA[i] = m.t + a.cadence
    const touches = traverses(an)
    ev.push({ type: 'rail', x0: b.x, y0: b.y, x1: b.x + Math.cos(an) * a.portee, y1: b.y + Math.sin(an) * a.portee, arme: a.id })
    for (const e of touches) {
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      effetsDuCoup(c, m, a, e, ev)
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}

/** Une ancre de tentacule (en unités du vaisseau, le nez vers +x), dans le monde. */
export function ancreDansLeMonde(v: Vaisseau, a: [number, number]): Vecteur {
  return { x: v.x + Math.cos(v.cap) * a[0] - Math.sin(v.cap) * a[1], y: v.y + Math.sin(v.cap) * a[0] + Math.cos(v.cap) * a[1] }
}

/** LES TENTACULES (voir `Arme.tentacule`) : chacune prend sa cible, s'étend, pique, reste plantée, se rétracte, se repose. */
function menerLesTentacules(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const te = a.tentacule
    if (te === undefined) return
    // (une par ancre, nées au repos)
    for (let k = 0; k < te.ancres.length; k++) if (!m.tentacules.some((x) => x.arme === i && x.ancre === k)) m.tentacules.push({ arme: i, ancre: k, fait: 'repos', depuis: -1e9, cible: null, tx: 0, ty: 0, u: 0, virage: 0 })
  })
  // (TOUR À TOUR : une seule part, de la racine la plus proche de sa cible — voir `Arme.tentacule.alterne`)
  c.armes.forEach((a, i) => {
    const te = a.tentacule
    if (te?.alterne !== true || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const libres = m.tentacules.filter((x) => x.arme === i && x.fait === 'repos')
    if (libres.length === 0) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    const visees = new Set(m.tentacules.filter((x) => x.fait !== 'repos').map((x) => x.cible))
    const ve = ennemiVerrouille(m)
    let choix: Ennemi | undefined = ve !== null && aPortee(ve) ? ve : undefined
    if (choix === undefined) {
      let dc = Infinity
      let dLibre = Infinity
      let proche: Ennemi | undefined
      let libre: Ennemi | undefined
      for (const e of m.ennemis) {
        if (!aPortee(e)) continue
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (d < dc) (dc = d), (proche = e)
        if (!visees.has(e.id) && d < dLibre) (dLibre = d), (libre = e)
      }
      choix = libre ?? proche
    }
    if (choix === undefined) return
    const cible = choix
    const distance = (x: Tentacule): number => {
      const an = ancreDansLeMonde(v, te.ancres[x.ancre] ?? [0, 0])
      return Math.hypot(cible.corps.x - an.x, cible.corps.y - an.y)
    }
    const tn = libres.reduce((b, x) => (distance(x) < distance(b) ? x : b))
    const an = ancreDansLeMonde(v, te.ancres[tn.ancre] ?? [0, 0])
    tn.fait = 'aller'
    tn.depuis = m.t
    tn.cible = cible.id
    tn.tx = cible.corps.x
    tn.ty = cible.corps.y
    const h = tire(m.graine, m.prochainId++, 31)
    tn.virage = (h < 0.5 ? -1 : 1) * te.virage * (0.6 + 0.8 * Math.abs(h - 0.5))
    m.armesA[i] = m.t + a.cadence
    ev.push({ type: 'tentacule', x: an.x, y: an.y })
  })
  for (const tn of m.tentacules) {
    const a = c.armes[tn.arme]
    const te = a?.tentacule
    if (a === undefined || te === undefined) continue
    const an = ancreDansLeMonde(v, te.ancres[tn.ancre] ?? [0, 0])
    const age = m.t - tn.depuis
    const cible = tn.cible === null ? undefined : m.ennemis.find((e) => e.id === tn.cible)
    if (cible !== undefined) (tn.tx = cible.corps.x), (tn.ty = cible.corps.y)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - an.x, e.corps.y - an.y) <= a.portee + rayonDe(c, e)
    if (tn.fait === 'repos') {
      tn.u = 0
      if (te.alterne === true || m.phase !== 'vol' || age < a.cadence) continue
      let choix: Ennemi | undefined
      const ve = ennemiVerrouille(m)
      if (ve !== null && aPortee(ve)) choix = ve
      else {
        // (le plus proche que les autres ne visent pas ; sinon le plus proche tout court)
        const visees = new Set(m.tentacules.filter((x) => x !== tn && x.fait !== 'repos').map((x) => x.cible))
        let dc = Infinity
        let dLibre = Infinity
        let libre: Ennemi | undefined
        let proche: Ennemi | undefined
        for (const e of m.ennemis) {
          if (!aPortee(e)) continue
          const d = Math.hypot(e.corps.x - an.x, e.corps.y - an.y)
          if (d < dc) (dc = d), (proche = e)
          if (!visees.has(e.id) && d < dLibre) (dLibre = d), (libre = e)
        }
        choix = libre ?? proche
      }
      if (choix === undefined) continue
      tn.fait = 'aller'
      tn.depuis = m.t
      tn.cible = choix.id
      tn.tx = choix.corps.x
      tn.ty = choix.corps.y
      // (son virage : d'un côté ou de l'autre, plus ou moins fort, tiré au hasard)
      const h = tire(m.graine, m.prochainId++, 31)
      tn.virage = (h < 0.5 ? -1 : 1) * te.virage * (0.6 + 0.8 * Math.abs(h - 0.5))
      ev.push({ type: 'tentacule', x: an.x, y: an.y })
    } else if (tn.fait === 'aller') {
      // (sa cible morte, ou partie trop loin : elle se rétracte d'où elle en est)
      if (cible === undefined || Math.hypot(tn.tx - an.x, tn.ty - an.y) > (a.portee + c.ennemi.rayon) * 1.3 + (te.alterne === true ? 20 : 0)) {
        tn.fait = 'retour'
        tn.depuis = m.t - (1 - tn.u) * te.retour
        continue
      }
      tn.u = Math.min(1, age / te.aller)
      if (tn.u >= 1) {
        tn.fait = 'plantee'
        tn.depuis = m.t
        const critique = critiqueSur(c, m, a, cible, () => tire(m.graine, m.prochainId++, 12))
        cible.pv -= a.degats * (critique ? facteurSur(c, m, a, cible) : 1)
        ev.push({ type: 'piqure', x: cible.corps.x, y: cible.corps.y })
        ev.push({ type: 'ennemiTouche', id: cible.id, x: cible.corps.x, y: cible.corps.y, critique })
        if (cible.pv <= 0) abattreLEnnemi(c, m, cible, ev)
      }
    } else if (tn.fait === 'plantee') {
      tn.u = 1
      if (age >= te.tenue || cible === undefined) {
        tn.fait = 'retour'
        tn.depuis = m.t
      }
    } else {
      tn.u = Math.max(0, 1 - age / te.retour)
      if (tn.u <= 0) {
        tn.fait = 'repos'
        tn.depuis = m.t
        tn.cible = null
      }
    }
  }
}

/** Un insecte EMPOISONNÉ (voir `Ennemi.poison`) : jusqu'à `duree` d'ici — le plus long et le plus fort l'emportent. */
function empoisonner(m: Monde, e: Ennemi, po: { duree: number; dps: number }): void {
  const encore = e.poison !== undefined && e.poison.jusque > m.t
  e.poison = { jusque: Math.max(encore ? e.poison!.jusque : 0, m.t + po.duree), dps: Math.max(encore ? e.poison!.dps : 0, po.dps) }
  e.poisonA = Math.max(e.poisonA ?? 0, e.poison.jusque)
}

/** Un insecte RONGÉ par l'acide (voir `Arme.crachat`) : jusqu'à `duree` d'ici — le plus long et le plus fort l'emportent. */
function ronger(c: ConfigVaisseau, m: Monde, e: Ennemi, ac: { duree: number; dps: number; bonus: number }, ev: Evenement[]): void {
  if (e.acide === undefined || e.acide.jusque <= m.t) ev.push({ type: 'ronge', id: e.id, x: e.corps.x, y: e.corps.y })
  e.acide = { jusque: Math.max(e.acide?.jusque ?? 0, m.t + dureeDEtat(c, ac.duree)), dps: Math.max(e.acide?.jusque !== undefined && e.acide.jusque > m.t ? e.acide.dps : 0, ac.dps), bonus: Math.max(e.acide?.jusque !== undefined && e.acide.jusque > m.t ? e.acide.bonus : 0, ac.bonus) }
}

/**
 * LE COUP D'UN OBUS SUR `e` : son critique est tiré au départ, sans cible ; sur un insecte vulnérable (« Point faible »),
 * un critique gagne les points de facteur de plus, et un coup qui ne l'était pas a sa chance de plus de le devenir.
 */
function coupDObus(c: ConfigVaisseau, m: Monde, o: Obus, e: Ennemi): { degats: number; critique: boolean } {
  if (!vulnerable(c, m, e)) return { degats: o.degats, critique: o.critique === true }
  const a = c.armes.find((x) => x.id === o.arme)
  const f = facteurDeCritique(c, a)
  const plus = 1 + c.renforts.corrosion
  if (o.critique === true) return { degats: (o.degats * (f + ELEMENTAIRES.vulnerabilite.facteur * plus)) / f, critique: true }
  if (tire(m.graine, m.prochainId++, 98) < ELEMENTAIRES.vulnerabilite.chance * plus) return { degats: o.degats * (f + ELEMENTAIRES.vulnerabilite.facteur * plus), critique: true }
  return { degats: o.degats, critique: false }
}

/** Un insecte FIGÉ (voir `Ennemi.figeA`) : pris dans la glace, `duree` secondes. */
function figer(m: Monde, e: Ennemi, duree: number, sorte: 'glace', ev: Evenement[]): void {
  if (e.asteroide !== undefined) return
  e.figeA = Math.max(e.figeA ?? -1, m.t + duree)
  e.fige = sorte
  ev.push({ type: 'fige', id: e.id, x: e.corps.x, y: e.corps.y, sorte })
}

/** Le ralenti le plus fort que portent les armes (leur givre, leur gel, leur nova…) ; sans givre, `defaut`. */
function ralentiDesArmes(c: ConfigVaisseau, defaut: number): number {
  let r = defaut
  let vu = false
  const fouiller = (o: unknown): void => {
    if (o === null || typeof o !== 'object') return
    for (const [cle, v] of Object.entries(o)) {
      if (cle === 'ralenti' && typeof v === 'number' && v > 0 && v < 1) r = vu ? Math.min(r, v) : v, (vu = true)
      else fouiller(v)
    }
  }
  for (const a of c.armes) fouiller(a)
  return r
}
/**
 * L'AURA GLACIALE (voir `ELEMENTAIRES.auraGlaciale`) : tout insecte à son rayon du vaisseau est sous givre — sans dégâts,
 * et sans être un coup de givre (`geler` sans `coup` : pas de Gel profond).
 */
function menerLAuraGlaciale(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  if (!c.elementaires.auraGlaciale || m.phase !== 'vol') return
  const A = ELEMENTAIRES.auraGlaciale
  const v = m.vaisseau
  const ralenti = ralentiDesArmes(c, A.ralenti)
  for (const e of m.ennemis) {
    if (e.asteroide !== undefined || Math.hypot(e.corps.x - v.x, e.corps.y - v.y) > A.rayon + rayonDe(c, e)) continue
    geler(c, m, e, 0.25, ralenti, ev)
  }
}

/**
 * LA BRÛLURE SE PROPAGE (« Propagation » — voir `ELEMENTAIRES.incendie` ; Keko, 24/11 : « si deux ennemis sont très
 * proches, le feu se répand ») : chaque seconde de la partie, tout insecte en feu allume ceux qui ne brûlent pas, presque
 * collés à lui (`ecart` de bord à bord) — une brûlure entière, comme d'un coup. Ceux qu'il allume attendent la seconde suivante.
 */
function propagerLeFeu(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const P = ELEMENTAIRES.incendie
  if (!c.elementaires.incendie || Math.floor(m.t / P.periode) === Math.floor((m.t - dt) / P.periode)) return
  const enFeu = m.ennemis.filter((e) => e.asteroide === undefined && (e.bruleA ?? -1) > m.t)
  for (const a of enFeu)
    for (const b of m.ennemis) {
      if (b === a || b.asteroide !== undefined || (b.bruleA ?? -1) > m.t) continue
      if (Math.hypot(b.corps.x - a.corps.x, b.corps.y - a.corps.y) - rayonDe(c, a) - rayonDe(c, b) > P.ecart) continue
      brulerAuContact(c, m, b, a.dureeBrulure ?? 2, a.dpsBrulure ?? 0)
      ev.push({ type: 'feuPropage', de: a.id, vers: b.id, x0: a.corps.x, y0: a.corps.y, x1: b.corps.x, y1: b.corps.y })
    }
}

/**
 * Un insecte ÉLECTROCUTÉ (voir `Arme.electrocution`) : jusqu'à `duree` d'ici (voir `dureeDEtat`) — le plus fort l'emporte.
 * `direct` : c'est un COUP ÉLECTRIQUE (un arc de drone, un éclair, une balle électrique) — s'il l'était déjà, ce coup tire
 * sa chance de faire sauter un arc (voir `propagerLElectrocution`) ; une zone qui électrocute sans cesse (la tempête, le
 * sillon) ou l'arc lui-même ne le sont pas.
 */
// (`arc` : c'est un arc d'électrocution qui le pose — avec un coup électrique, il peut faire tomber la foudre, voir `foudroyer`)
function electrocuter(c: ConfigVaisseau, m: Monde, e: Ennemi, el: { duree: number; chance: number; degats: number; saut: number }, ev: Evenement[], direct = false, arc = false): void {
  if (e.asteroide !== undefined) return
  const encore = e.electrocute !== undefined && e.electrocute.jusque > m.t
  if (!encore) ev.push({ type: 'electrocute', id: e.id, x: e.corps.x, y: e.corps.y })
  e.electrocute = {
    jusque: Math.max(encore ? e.electrocute!.jusque : 0, m.t + dureeDEtat(c, el.duree)),
    chance: Math.max(encore ? e.electrocute!.chance : 0, el.chance),
    degats: Math.max(encore ? e.electrocute!.degats : 0, el.degats),
    saut: Math.max(encore ? e.electrocute!.saut : 0, el.saut),
  }
  if (direct && encore) ev.push({ type: 'coupElectrique', id: e.id, x: e.corps.x, y: e.corps.y, ...e.electrocute })
  // (« FOUDRE » : un coup électrique ou un arc qui électrocute — pas la tempête, pas le sillon, qui l'appliquent sans cesse)
  if ((direct || arc) && c.elementaires.foudre && tire(m.graine, m.prochainId++, 96) < ELEMENTAIRES.foudre.chance) foudroyer(c, m, e, ev)
}
/**
 * LA FOUDRE TOMBE DU CIEL (« Foudre » — voir `ELEMENTAIRES`) sur `e` : ses dégâts, et leur part à ce qui est autour, dans
 * son rayon. Ce ne sont pas des coups électriques : elle ne fait pas sauter d'arc, et n'en appelle pas une autre.
 */
function foudroyer(c: ConfigVaisseau, m: Monde, e: Ennemi, ev: Evenement[]): void {
  const F = ELEMENTAIRES.foudre
  const x = e.corps.x
  const y = e.corps.y
  ev.push({ type: 'foudreDuCiel', id: e.id, x, y, rayon: F.rayon })
  for (const o of [...m.ennemis]) {
    if (o.asteroide !== undefined) continue
    if (o !== e && Math.hypot(o.corps.x - x, o.corps.y - y) > F.rayon + rayonDe(c, o)) continue
    o.pv -= (o === e ? F.degats : F.degats * F.part) * (1 + c.renforts.electrocution)
    ev.push({ type: 'ennemiTouche', id: o.id, x: o.corps.x, y: o.corps.y, critique: false })
    if (o.pv <= 0) abattreLEnnemi(c, m, o, ev)
  }
}
/** (au plus tant d'arcs d'électrocution par pas) */
const ARCS_PAR_PAS = 24
/**
 * L'ÉLECTROCUTION SE PROPAGE (voir `Arme.electrocution`) : chaque COUP ÉLECTRIQUE de ce pas sur un insecte déjà électrocuté
 * (Keko, 24/11 : « il faut que ce soit des dégâts électriques qui soient infligés ; si j'inflige des dégâts corrosifs à
 * une cible sous électrocution, l'effet ne se déclenche pas » — d'abord, tout coup direct le déclenchait) tire sa chance ;
 * si elle sort, un arc saute de lui — même s'il en est mort — sur l'insecte le plus proche à `saut` au plus : `degats`, et
 * il est électrocuté à son tour. L'ARC N'EN APPELLE PAS UN AUTRE (en chaîne, deux insectes électrocutés se renvoyaient
 * l'arc sans fin — le test, à chance 1, en comptait vingt-quatre) ; l'insecte qu'il électrocute fera sauter le sien au
 * prochain coup électrique qu'il prendra.
 */
function propagerLElectrocution(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  let arcs = 0
  const coups = ev.length
  for (let i = 0; i < coups && arcs < ARCS_PAR_PAS; i++) {
    const x = ev[i]
    if (x.type !== 'coupElectrique') continue
    if (tire(m.graine, m.prochainId++, 97) >= x.chance) continue
    // (le plus proche à son saut ; avec « SURTENSION », tous ceux qui y sont — voir `ELEMENTAIRES`)
    const aPortee = m.ennemis.filter((o) => o.id !== x.id && o.asteroide === undefined && Math.hypot(o.corps.x - x.x, o.corps.y - x.y) <= x.saut + rayonDe(c, o))
    if (aPortee.length === 0) continue
    const vises = c.elementaires.surtension ? aPortee : [aPortee.reduce((p, o) => (Math.hypot(o.corps.x - x.x, o.corps.y - x.y) < Math.hypot(p.corps.x - x.x, p.corps.y - x.y) ? o : p))]
    arcs++
    for (const proche of vises) {
      ev.push({ type: 'arcDElectrocution', de: x.id, vers: proche.id, x0: x.x, y0: x.y, x1: proche.corps.x, y1: proche.corps.y })
      electrocuter(c, m, proche, { duree: Math.max(0, x.jusque - m.t), chance: x.chance, degats: x.degats, saut: x.saut }, ev, false, true)
      // (au vortex, l'arc fait partout la même chose — voir `ConfigVaisseau.arcDElectrocution`)
      proche.pv -= (c.arcDElectrocution > 0 ? c.arcDElectrocution : x.degats) * (1 + c.renforts.electrocution)
      ev.push({ type: 'ennemiTouche', id: proche.id, x: proche.corps.x, y: proche.corps.y, critique: false })
      if (proche.pv <= 0) abattreLEnnemi(c, m, proche, ev)
    }
  }
}

/** Un point dans un cône (sa pointe, son cap, son demi-angle, sa longueur), un insecte compté avec son rayon. */
function dansLeCone(x: number, y: number, px: number, py: number, cap: number, cone: number, longueur: number, rayon: number): boolean {
  const dx = x - px
  const dy = y - py
  const d = Math.hypot(dx, dy)
  if (d > longueur + rayon) return false
  if (d <= rayon) return true
  return Math.abs(ecartDAngle(cap, Math.atan2(dy, dx))) <= cone + Math.asin(Math.min(1, rayon / d))
}

/** LES CRACHATS D'ACIDE (voir `Arme.crachat`) : le cône craché, la flaque qu'il laisse, et l'acide qui ronge. */
function cracherLAcide(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const cr = a.crachat
    if (cr === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const b = boucheDansLeMonde(v, a)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - b.x, e.corps.y - b.y) <= a.portee + rayonDe(c, e)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - b.x, e.corps.y - b.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const cap = Math.atan2(cible.corps.y - b.y, cible.corps.x - b.x)
    m.flaquesAcides.push({ id: m.prochainId++, arme: i, x: b.x, y: b.y, cap, nee: m.t })
    ev.push({ type: 'crachat', x: b.x, y: b.y, cap, cone: cr.cone, portee: a.portee, arme: a.id })
    for (const e of [...m.ennemis]) {
      if (!dansLeCone(e.corps.x, e.corps.y, b.x, b.y, cap, cr.cone, a.portee, rayonDe(c, e))) continue
      ronger(c, m, e, cr.acide, ev)
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
  // (les flaques : elles s'effacent au bout de leur durée ; tout insecte dedans est rongé)
  m.flaquesAcides = m.flaquesAcides.filter((f) => {
    const a = c.armes[f.arme]
    const cr = a?.crachat
    if (a === undefined || cr === undefined || m.t - f.nee >= cr.duree) return false
    for (const e of m.ennemis) if (dansLeCone(e.corps.x, e.corps.y, f.x, f.y, f.cap, cr.cone, a.portee, rayonDe(c, e))) ronger(c, m, e, cr.acide, ev)
    return true
  })
  // (l'acide ronge : ses dégâts à lui ; le poison, les siens)
  for (const e of [...m.ennemis]) {
    const ronge = e.acide !== undefined && e.acide.jusque > m.t
    const empoisonne = e.poison !== undefined && e.poison.jusque > m.t
    if (!ronge && !empoisonne) continue
    if (ronge) e.pv -= e.acide!.dps * dt
    if (empoisonne) e.pv -= e.poison!.dps * dt
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LES PARASITES (voir `Arme.parasite`) : le crachat d'une larve, son vol, l'accroche, le festin, le saut à la mort de l'hôte. */
function menerLesParasites(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  const porteurs = (): Set<number> => new Set(m.parasites.flatMap((p) => [p.hote, p.cible]).filter((x): x is number => x !== null))
  c.armes.forEach((a, i) => {
    const pa = a.parasite
    if (pa === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    if (m.parasites.filter((p) => p.arme === i).length >= pa.max) return
    const pris = porteurs()
    const libre = (e: Ennemi): boolean => !pris.has(e.id) && Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && libre(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (libre(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const an = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    m.parasites.push({ id: m.prochainId++, arme: i, hote: null, cible: cible.id, x: v.x, y: v.y, vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, depuis: m.t })
    ev.push({ type: 'parasiteLance', x: v.x, y: v.y, arme: a.id })
  })
  m.parasites = m.parasites.filter((p) => {
    const a = c.armes[p.arme]
    const pa = a?.parasite
    if (a === undefined || pa === undefined) return false
    if (p.hote !== null) {
      const hote = m.ennemis.find((e) => e.id === p.hote)
      if (hote !== undefined) {
        // (accroché : il suit son hôte et le ronge)
        p.x = hote.corps.x
        p.y = hote.corps.y
        if (pa.acide !== undefined) ronger(c, m, hote, pa.acide, ev)
        hote.pv -= pa.dps * dt
        if (hote.pv <= 0) abattreLEnnemi(c, m, hote, ev)
        return true
      }
      // (SON HÔTE EST MORT : il saute sur UN autre — le plus proche à moins de `saut` qui n'en porte pas — ou il meurt)
      const pris = porteurs()
      let dc = pa.saut + c.ennemi.rayon
      let suivant: Ennemi | undefined
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - p.x, e.corps.y - p.y)
        if (!pris.has(e.id) && d <= dc) (dc = d), (suivant = e)
      }
      if (suivant === undefined) {
        ev.push({ type: 'parasiteMort', x: p.x, y: p.y })
        return false
      }
      p.hote = null
      p.cible = suivant.id
      p.depuis = m.t
      const an = Math.atan2(suivant.corps.y - p.y, suivant.corps.x - p.x)
      p.vx = Math.cos(an) * a.vitesse
      p.vy = Math.sin(an) * a.vitesse
      // (UN BOND, PAS UN VOL — Keko, 17/11 : « on ne le voit pas sauter d'ennemi en ennemi, on dirait qu'il se téléporte » :
      // il rejoint le suivant en un temps fixé par la distance, de 0,4 à 0,7 s, le long d'une cloche que le dessin trace)
      p.bond = { x0: p.x, y0: p.y, duree: Math.max(0.4, Math.min(0.7, dc / 110)) }
      ev.push({ type: 'parasiteSaute', x: p.x, y: p.y })
      return true
    }
    // (en vol : il file sur sa cible ; elle disparue, ou trop long, il meurt)
    const cible = m.ennemis.find((e) => e.id === p.cible)
    if (cible === undefined || m.t - p.depuis > pa.vie) {
      ev.push({ type: 'parasiteMort', x: p.x, y: p.y })
      return false
    }
    // (EN PLEIN BOND : il va de son point de départ à l'insecte, là où celui-ci est, et s'y accroche à l'arrivée)
    if (p.bond !== undefined) {
      const u = Math.min(1, (m.t - p.depuis) / p.bond.duree)
      const e = u * u * (3 - 2 * u)
      p.x = p.bond.x0 + (cible.corps.x - p.bond.x0) * e
      p.y = p.bond.y0 + (cible.corps.y - p.bond.y0) * e
      if (u >= 1) {
        p.bond = undefined
        p.hote = cible.id
        p.cible = null
        ev.push({ type: 'parasiteAccroche', id: cible.id, x: cible.corps.x, y: cible.corps.y })
      }
      return true
    }
    const dx = cible.corps.x - p.x
    const dy = cible.corps.y - p.y
    const d = Math.hypot(dx, dy) || 1
    const k = Math.min(1, 8 * dt)
    p.vx += ((dx / d) * a.vitesse - p.vx) * k
    p.vy += ((dy / d) * a.vitesse - p.vy) * k
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (Math.hypot(cible.corps.x - p.x, cible.corps.y - p.y) <= rayonDe(c, cible) + 2) {
      p.hote = cible.id
      p.cible = null
      ev.push({ type: 'parasiteAccroche', id: cible.id, x: cible.corps.x, y: cible.corps.y })
    }
    return true
  })
}

/** LES FLÉAUX (voir `Arme.fleau`) : la masse tourne au bout de sa chaîne, avec son inertie, et frappe ce qu'elle croise. */
function menerLesFleaux(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const fl = a.fleau
    if (fl === undefined) return
    let f = m.fleaux.find((x) => x.arme === i)
    if (f === undefined) {
      f = { arme: i, x: v.x + fl.longueur, y: v.y, vx: v.vx, vy: v.vy + fl.vitesse * fl.longueur, frappes: {}, frappesChaine: {} }
      m.fleaux.push(f)
    }
    // (poussée le long du cercle, vers sa vitesse de tour — relative au vaisseau)
    let dx = f.x - v.x
    let dy = f.y - v.y
    let d = Math.hypot(dx, dy) || 1
    let ux = dx / d
    let uy = dy / d
    const tx = -uy
    const ty = ux
    const vt = (f.vx - v.vx) * tx + (f.vy - v.vy) * ty
    const k = Math.min(1, 5 * dt)
    f.vx += tx * (fl.vitesse * fl.longueur - vt) * k
    f.vy += ty * (fl.vitesse * fl.longueur - vt) * k
    f.x += f.vx * dt
    f.y += f.vy * dt
    // (la chaîne la tient à sa longueur : ramenée sur le cercle, sa vitesse le long de la chaîne retirée)
    dx = f.x - v.x
    dy = f.y - v.y
    d = Math.hypot(dx, dy) || 1
    ux = dx / d
    uy = dy / d
    f.x = v.x + ux * fl.longueur
    f.y = v.y + uy * fl.longueur
    const vr = (f.vx - v.vx) * ux + (f.vy - v.vy) * uy
    f.vx -= ux * vr
    f.vy -= uy * vr
    if (m.phase !== 'vol') return
    for (const e of [...m.ennemis]) {
      // (LA MASSE, à sa prise)
      if (Math.hypot(e.corps.x - f.x, e.corps.y - f.y) <= fl.prise + rayonDe(c, e)) {
        if (m.t - (f.frappes[e.id] ?? -1e9) < fl.rebond) continue
        f.frappes[e.id] = m.t
        f.frappesChaine[e.id] = m.t
        const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
        e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
        ev.push({ type: 'fleauFrappe', x: e.corps.x, y: e.corps.y })
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
        continue
      }
      // (LA CHAÎNE : à moins de son épaisseur du segment, du vaisseau à la masse)
      const ex = e.corps.x - v.x
      const ey = e.corps.y - v.y
      const le = ex * ux + ey * uy
      if (le < 0 || le > fl.longueur || Math.abs(ex * uy - ey * ux) > fl.chaine.epaisseur + rayonDe(c, e)) continue
      if (m.t - (f.frappesChaine[e.id] ?? -1e9) < fl.rebond) continue
      f.frappesChaine[e.id] = m.t
      const critique = critiqueTire(c, m, a, e)
      e.pv -= fl.chaine.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'chaineFrappe', x: e.corps.x, y: e.corps.y })
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}

/** LES MINES D'ACIDE (voir `Arme.mine`) : le lancer en cloche, l'attente, l'éclatement en gaz, la fin. */
function menerLesMines(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const mi = a.mine
    if (mi === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (… PUIS SANS CIBLE, EN PERMANENCE — Keko, 16/11 : « les mines ne ciblent pas les ennemis : le vaisseau les lance au
    // sol en permanence ; elles explosent quand un ennemi approche » : à sa cadence, insectes ou pas, une pustule tombe
    // autour de lui, dans une direction tirée au hasard, entre `portee` × 0,45 et `portee`)
    m.armesA[i] = m.t + a.cadence
    const id = m.prochainId++
    const an = tire(m.graine, id, 41) * Math.PI * 2
    const d = a.portee * (0.45 + 0.55 * tire(m.graine, id, 42))
    const x = v.x + Math.cos(an) * d
    const y = v.y + Math.sin(an) * d
    m.mines.push({ id, arme: i, x0: v.x, y0: v.y, x, y, lancee: m.t })
    const miennes = m.mines.filter((x2) => x2.arme === i)
    if (miennes.length > mi.max) m.mines.splice(m.mines.indexOf(miennes[0]), 1)
    ev.push({ type: 'mineLancee', x: v.x, y: v.y, arme: a.id })
  })
  m.mines = m.mines.filter((mn) => {
    const a = c.armes[mn.arme]
    const mi = a?.mine
    if (a === undefined || mi === undefined) return false
    const age = m.t - mn.lancee
    // (en vol, elle ne touche rien ; posée, elle attend)
    if (age < mi.vol) return true
    if (age >= mi.vol + mi.duree) {
      ev.push({ type: 'mineFinie', x: mn.x, y: mn.y })
      return false
    }
    if (!m.ennemis.some((e) => Math.hypot(e.corps.x - mn.x, e.corps.y - mn.y) <= mi.rayon + rayonDe(c, e))) return true
    // (ELLE ÉCLATE EN GAZ : tout ce qui est dans le nuage perd ses dégâts et est EMPOISONNÉ — Keko, 19/11)
    ev.push({ type: 'gaz', x: mn.x, y: mn.y, rayon: mi.rayon })
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - mn.x, e.corps.y - mn.y) > mi.rayon + rayonDe(c, e)) continue
      // (LE GAZ RONGE — Keko, 21/11 : la vulnérabilité de l'effet corrosif, à la place des dégâts du poison)
      if (mi.corrosion !== undefined) ronger(c, m, e, { duree: mi.corrosion.duree, dps: 0, bonus: mi.corrosion.bonus }, ev)
      else if (mi.poison !== undefined) empoisonner(m, e, mi.poison)
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    return false
  })
}

/**
 * L'ACIDE MAJORE TOUT (voir `Arme.crachat`) : ce que chaque insecte rongé a perdu depuis `avant` — de toutes les sources
 * de ce pas, quelles qu'elles soient — lui est retiré une part `bonus` de plus. (Mesuré sur ses points plutôt que dans
 * chaque arme : une arme ajoutée demain sera majorée sans qu'on y pense.)
 */
function majorerParLAcide(c: ConfigVaisseau, m: Monde, avant: Map<Ennemi, number>, ev: Evenement[]): void {
  for (const [e, pv0] of avant) {
    if (e.acide === undefined || !m.ennemis.includes(e)) continue
    const perdu = pv0 - e.pv
    if (perdu <= 0) continue
    e.pv -= perdu * e.acide.bonus
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LES REJETONS (voir `Arme.rejeton`) : la ponte, la nage par à-coups, la chasse, les coups de tentacule, la fin. */
function menerLesRejetons(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const rj = a.rejeton
    if (rj === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    if (m.rejetons.filter((r) => r.arme === i).length >= rj.max) return
    // (MÊME SANS INSECTE — Keko, 19/11 : « que le Kraken invoque des rejetons même en l'absence d'ennemis » : sans proie, un
    // rejeton se tient à sa place derrière le vaisseau, prêt)
    m.armesA[i] = m.t + a.cadence
    // (pondu derrière le vaisseau, lancé vers l'arrière)
    const x = v.x - Math.cos(v.cap) * 8
    const y = v.y - Math.sin(v.cap) * 8
    m.rejetons.push({ id: m.prochainId++, arme: i, x, y, vx: -Math.cos(v.cap) * 30 + v.vx, vy: -Math.sin(v.cap) * 30 + v.vy, nee: m.t, cible: null, frappeA: m.t })
    ev.push({ type: 'rejeton', x, y })
  })
  for (let k = m.rejetons.length - 1; k >= 0; k--) {
    const r = m.rejetons[k]
    const a = c.armes[r.arme]
    const rj = a?.rejeton
    if (a === undefined || rj === undefined || m.t - r.nee >= rj.duree || m.phase !== 'vol') {
      m.rejetons.splice(k, 1)
      ev.push({ type: 'rejetonFini', x: r.x, y: r.y })
      continue
    }
    // (sa proie : le verrouillé à sa vue, sinon le plus proche de lui)
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - r.x, e.corps.y - r.y)
    let proie: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && dist(ve) <= rj.vue) proie = ve
    else {
      let dc = rj.vue
      for (const e of m.ennemis) if (dist(e) < dc) (dc = dist(e)), (proie = e)
    }
    r.cible = proie?.id ?? null
    // (où il veut aller : sur sa proie, jusqu'à portée de tentacule ; sans proie, sa place derrière le vaisseau)
    let bx: number
    let by: number
    let arret: number
    // (… ET IL TIENT SES DISTANCES — Keko, 16/11 : « ils poursuivent toujours sans attaquer ; il faut qu'ils attaquent un peu à
    // distance en projetant leurs tentacules » : il s'arrête aux deux tiers de son allonge, d'où sa tentacule porte)
    if (proie !== undefined) (bx = proie.corps.x), (by = proie.corps.y), (arret = rj.allonge * 0.65)
    else {
      const cote = r.id % 2 === 0 ? 1 : -1
      bx = v.x - Math.cos(v.cap) * 16 - Math.sin(v.cap) * 9 * cote
      by = v.y - Math.sin(v.cap) * 16 + Math.cos(v.cap) * 9 * cote
      arret = 2
    }
    const dx = bx - r.x
    const dy = by - r.y
    const d = Math.hypot(dx, dy) || 1
    // (il nage par à-coups : sa vitesse voulue bat, deux fois et demie par seconde)
    const bat = 0.55 + 0.45 * Math.max(0, Math.sin((m.t - r.nee) * 2.5 * Math.PI * 2 + r.id))
    const vit = d <= arret ? 0 : Math.min(rj.vitesse * bat, (d - arret) * 4)
    const k2 = Math.min(1, rj.acces * dt)
    r.vx += ((dx / d) * vit - r.vx) * k2
    r.vy += ((dy / d) * vit - r.vy) * k2
    r.x += r.vx * dt
    r.y += r.vy * dt
    // (à portée de tentacule : il fouette)
    if (proie !== undefined && dist(proie) <= rj.allonge + rayonDe(c, proie) && m.t >= r.frappeA) {
      r.frappeA = m.t + rj.periode
      const critique = critiqueSur(c, m, a, proie, () => tire(m.graine, m.prochainId++, 12))
      proie.pv -= a.degats * (critique ? facteurSur(c, m, a, proie) : 1)
      ev.push({ type: 'coupDeRejeton', id: r.id, x: proie.corps.x, y: proie.corps.y })
      ev.push({ type: 'ennemiTouche', id: proie.id, x: proie.corps.x, y: proie.corps.y, critique })
      if (proie.pv <= 0) abattreLEnnemi(c, m, proie, ev)
    }
  }
}

/** L'ÉPINE D'OS DU VER (voir `Arme.epines`) : le tir sur l'insecte, la course qui traverse tout sans rien emporter. */
function menerLesEpines(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    if (a.epines === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (le verrouillé à portée d'abord, sinon le plus proche)
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    const ve = ennemiVerrouille(m)
    let cible: Ennemi | null = ve !== null && dist(ve) <= a.portee ? ve : null
    if (cible === null) {
      let dc = a.portee
      for (const e of m.ennemis) if (dist(e) <= dc) (dc = dist(e)), (cible = e)
    }
    if (cible === null) return
    m.armesA[i] = m.t + a.cadence
    // (là où il sera quand elle arrivera)
    const temps = dist(cible) / a.vitesse
    const an = Math.atan2(cible.corps.y + cible.corps.vy * temps - v.y, cible.corps.x + cible.corps.vx * temps - v.x)
    const x = v.x + Math.cos(an) * (c.rayon + 2)
    const y = v.y + Math.sin(an) * (c.rayon + 2)
    m.brochettes.push({ id: m.prochainId++, arme: i, x, y, vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, touches: [] })
    ev.push({ type: 'epines', x, y })
  })
  m.brochettes = m.brochettes.filter((b) => {
    const a = c.armes[b.arme]
    const ep = a?.epines
    if (a === undefined || ep === undefined) return false
    b.vie -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    // (ELLE TRAVERSE TOUT : chacun à sa largeur prend le coup, une fois, et reste où il est)
    for (const e of [...m.ennemis]) {
      if (b.touches.includes(e.id) || Math.hypot(e.corps.x - b.x, e.corps.y - b.y) > rayonDe(c, e) + ep.largeur) continue
      b.touches.push(e.id)
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, b.id * 31 + e.id, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      ev.push({ type: 'transperce', id: e.id, x: e.corps.x, y: e.corps.y })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    if (b.vie > 0) return true
    ev.push({ type: 'epineFinie', x: b.x, y: b.y, cap: Math.atan2(b.vy, b.vx) })
    return false
  })
}

/** JUSQU'OÙ PORTE UN HYPERCUBE : jusqu'à son dernier contact, tous ses bonds de la même longueur. */
export const allongeDeLHypercube = (a: Arme): number => (a.hypercube === undefined ? a.portee : a.hypercube.bond * a.hypercube.rebonds)

/**
 * OÙ SERA UN INSECTE dans `T` secondes (la visée de l'hypercube) : un insecte qui CHASSE LE VAISSEAU (`aggro`) fonce vers
 * lui — vers là où le vaisseau sera, à sa vitesse —, accélère jusqu'à sa pointe et s'arrête à son contact ; les autres
 * filent droit à leur vitesse. (Mesuré : prédits en ligne droite, les insectes qui chargent étaient vus passer à travers
 * le vaisseau, et le premier contact ne touchait que 37 fois sur 90.)
 */
function ouSeraLInsecte(c: ConfigVaisseau, m: Monde, e: Ennemi, T: number): Vecteur {
  if (e.fait !== 'aggro') return { x: e.corps.x + e.corps.vx * T, y: e.corps.y + e.corps.vy * T }
  const v = m.vaisseau
  const pres = c.rayon + c.ennemi.rayon + 2
  let x = e.corps.x
  let y = e.corps.y
  let vx = e.corps.vx
  let vy = e.corps.vy
  const pas = 1 / 30
  for (let t = 0; t < T - 1e-9; t += pas) {
    const dt = Math.min(pas, T - t)
    const cx = v.x + v.vx * t - x
    const cy = v.y + v.vy * t - y
    const d = Math.hypot(cx, cy)
    if (d <= pres) return { x, y }
    // (il veut sa pointe vers le vaisseau ; sa poussée l'y amène)
    const ax = (cx / d) * c.ennemi.vitesseMax - vx
    const ay = (cy / d) * c.ennemi.vitesseMax - vy
    const la = Math.hypot(ax, ay)
    const k = la > c.ennemi.poussee * dt ? (c.ennemi.poussee * dt) / la : 1
    vx += ax * k
    vy += ay * k
    x += vx * dt
    y += vy * dt
  }
  return { x, y }
}

/**
 * LA COUPE D'UN CUBE d'arête 1 par le plan x + y + z = `h` (de 0 à 3), perpendiculaire à sa grande diagonale : ses
 * sommets dans ce plan, autour de la diagonale, rangés en tournant — rien à 0 et à 3, un triangle jusqu'à 1, un hexagone
 * entre 1 et 2 (régulier à 1,5), le triangle retourné jusqu'à 3. Le plus loin qu'un sommet aille : √(2/3), à 1 et à 2.
 */
export function coupeDUnCube(h: number): Vecteur[] {
  const pts: Vecteur[] = []
  // (la base du plan : deux directions perpendiculaires à la diagonale, et perpendiculaires entre elles)
  const e1 = [1 / Math.SQRT2, -1 / Math.SQRT2, 0]
  const e2 = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)]
  for (let i = 0; i < 8; i++)
    for (const axe of [1, 2, 4]) {
      if (i & axe) continue
      const a = [i & 1 ? 1 : 0, i & 2 ? 1 : 0, i & 4 ? 1 : 0]
      const sa = a[0] + a[1] + a[2]
      // (l'arête de a vers b monte de 1 en x + y + z : elle coupe le plan si h est entre ses deux bouts)
      if (h < sa - 1e-9 || h > sa + 1 + 1e-9) continue
      const p = a.slice()
      p[axe === 1 ? 0 : axe === 2 ? 1 : 2] += h - sa
      const q = [p[0] - 0.5, p[1] - 0.5, p[2] - 0.5]
      const v = { x: q[0] * e1[0] + q[1] * e1[1] + q[2] * e1[2], y: q[0] * e2[0] + q[1] * e2[1] + q[2] * e2[2] }
      if (!pts.some((o) => Math.hypot(o.x - v.x, o.y - v.y) < 1e-6)) pts.push(v)
    }
  if (pts.length < 3) return []
  const cx = pts.reduce((s0, p) => s0 + p.x, 0) / pts.length
  const cy = pts.reduce((s0, p) => s0 + p.y, 0) / pts.length
  return pts.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx))
}

/** LA COUPE dans le monde à l'instant `t` (voir `Arme.coupe`) : ses sommets, tournés et à l'échelle — vide avant et après sa traversée. */
export function formeDeLaCoupe(co: Monde['coupes'][number], cp: NonNullable<Arme['coupe']>, t: number): Vecteur[] {
  const u = (t - co.nee) / cp.duree
  if (u <= 0 || u >= 1) return []
  const k = cp.rayon / Math.sqrt(2 / 3)
  const an = co.angle + cp.tour * (t - co.nee)
  const c0 = Math.cos(an)
  const s0 = Math.sin(an)
  return coupeDUnCube(3 * u).map((p) => ({ x: co.x + (p.x * c0 - p.y * s0) * k, y: co.y + (p.x * s0 + p.y * c0) * k }))
}

/** Un point est-il dans une forme convexe (rangée en tournant), à `marge` près ? */
function dansLaForme(f: Vecteur[], x: number, y: number, marge: number): boolean {
  if (f.length < 3) return false
  // (le sens des sommets : celui de la première arête vue du centre)
  const cx = f.reduce((s0, p) => s0 + p.x, 0) / f.length
  const cy = f.reduce((s0, p) => s0 + p.y, 0) / f.length
  for (let i = 0; i < f.length; i++) {
    const a = f[i]
    const b = f[(i + 1) % f.length]
    const L = Math.hypot(b.x - a.x, b.y - a.y)
    if (L < 1e-9) continue
    const cote = (px: number, py: number): number => ((b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x)) / L
    const sens = Math.sign(cote(cx, cy)) || 1
    if (cote(x, y) * sens < -marge) return false
  }
  return true
}

/** LES COUPES DU TESSERACT (voir `Arme.coupe`) : le choix du lieu, la traversée, les coups à ce qui est dedans. */
function menerLesCoupes(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const cp = a.coupe
    if (cp === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    // (au cœur de la nuée : l'insecte qui a le plus de voisins dans sa coupe ; le verrouillé d'abord)
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let meilleur = -1
      for (const e of m.ennemis) {
        if (!aPortee(e)) continue
        const n = m.ennemis.filter((o) => Math.hypot(o.corps.x - e.corps.x, o.corps.y - e.corps.y) <= cp.rayon).length
        if (n > meilleur) (meilleur = n), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const id = m.prochainId++
    const { x, y } = cible.corps
    m.coupes.push({ id, arme: i, x, y, nee: m.t, angle: tire(m.graine, id, 63) * Math.PI * 2, prochain: m.t + cp.periode })
    ev.push({ type: 'coupe', id, x, y, arme: a.id })
  })
  m.coupes = m.coupes.filter((co) => {
    const a = c.armes[co.arme]
    const cp = a?.coupe
    if (a === undefined || cp === undefined) return false
    // (À CHAQUE PÉRIODE, la coupe frappe tout ce qui est dedans — de sa forme à cet instant)
    while (m.t >= co.prochain && co.prochain < co.nee + cp.duree) {
      const f = formeDeLaCoupe(co, cp, co.prochain)
      for (const e of [...m.ennemis]) {
        if (!dansLaForme(f, e.corps.x, e.corps.y, rayonDe(c, e))) continue
        const critique = critiqueSur(c, m, a, e, () => tire(m.graine, co.id * 31 + e.id * 7 + Math.round(co.prochain * 100), 12))
        e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
      co.prochain += cp.periode
    }
    if (m.t < co.nee + cp.duree) return true
    // (LE POINT FINAL : la tranche se referme sur son centre, et ce qui est dessous prend le gros coup)
    let touches = 0
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - co.x, e.corps.y - co.y) > rayonDe(c, e)) continue
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, co.id * 31 + e.id * 7, 64))
      e.pv -= cp.fin * (critique ? facteurSur(c, m, a, e) : 1)
      touches++
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    ev.push({ type: 'coupeFinie', id: co.id, x: co.x, y: co.y, touches })
    return false
  })
}

/** LA ZONE D'UN DÉ DU DESTIN selon son chiffre (voir `Arme.de`) : `rayon` sur un 4, `pas` de plus par point au-dessus, de moins en dessous. */
export const zoneDuDe = (de: NonNullable<Arme['de']>, face: number): number => de.rayon + de.pas * (face - 4)

/** LES DÉS DU DESTIN (voir `Arme.de`) : le choix de l'insecte, le chiffre tiré, le dé qui le suit, l'impact sur la zone. */
function menerLesDes(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const de = a.de
    if (de === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const d = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    let cible = ennemiVerrouille(m)
    if (cible === null || d(cible) > a.portee + c.ennemi.rayon) {
      cible = null
      for (const e of m.ennemis) if (d(e) <= a.portee + rayonDe(c, e) && (cible === null || d(e) < d(cible))) cible = e
    }
    if (cible === null) return
    m.armesA[i] = m.t + a.cadence
    const id = m.prochainId++
    // (LE CHIFFRE, de 1 à 6 : tiré au lancer — le dessin le fait rouler, puis s'arrêter sur lui)
    const face = 1 + Math.min(5, Math.floor(tire(m.graine, id, 61) * 6))
    m.des.push({ id, arme: i, cible: cible.id, x: cible.corps.x, y: cible.corps.y, lance: m.t, tombe: m.t + de.roule + de.chute, face })
    ev.push({ type: 'de', id, x: cible.corps.x, y: cible.corps.y, arme: a.id, face })
  })
  for (let k = m.des.length - 1; k >= 0; k--) {
    const dd = m.des[k]
    const a = c.armes[dd.arme]
    const de = a?.de
    if (a === undefined || de === undefined) {
      m.des.splice(k, 1)
      continue
    }
    // (il reste au-dessus de son insecte tant qu'il vit)
    const e0 = m.ennemis.find((e) => e.id === dd.cible)
    if (e0 !== undefined) (dd.x = e0.corps.x), (dd.y = e0.corps.y)
    if (m.t < dd.tombe) continue
    m.des.splice(k, 1)
    const zone = zoneDuDe(de, dd.face)
    ev.push({ type: 'deImpact', id: dd.id, x: dd.x, y: dd.y, face: dd.face, rayon: zone })
    // (IL S'ABAT : toute la zone, d'autant plus large et plus fort que le chiffre est haut)
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - dd.x, e.corps.y - dd.y) > zone + rayonDe(c, e)) continue
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, dd.id * 31 + e.id * 7, 12))
      e.pv -= a.degats * dd.face * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}

/** L'HYPERCUBE DU TESSERACT (voir `Arme.hypercube`) : le lancer en cloche, les contacts au sol qui frappent, les rebonds. */
function menerLesHypercubes(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const hc = a.hypercube
    if (hc === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (le verrouillé à son allonge d'abord, sinon le plus proche — JUSQU'À SON DERNIER CONTACT)
    const allonge = allongeDeLHypercube(a)
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    const ve = ennemiVerrouille(m)
    let cible: Ennemi | null = ve !== null && dist(ve) <= allonge ? ve : null
    if (cible === null) {
      let dc = allonge
      for (const e of m.ennemis) if (dist(e) <= dc) (dc = dist(e)), (cible = e)
    }
    if (cible === null) return
    m.armesA[i] = m.t + a.cadence
    // (LE CONTACT QUI TOMBE SUR LUI : le premier qui peut l'atteindre LÀ OÙ IL SERA À CE CONTACT-LÀ — le k-ième tombe
    // `k` × `vol` secondes après le lancer, à `k` bonds au plus ; un insecte qui charge à 85 se rapproche de 40 par bond.
    // LE LANCER RACCOURCIT pour que ce contact tombe pile sur lui)
    // (le j-ième contact l'atteint si le lancer qu'il demande tient entre 0 et un bond ; un insecte qui charge vite peut
    // n'en laisser aucun — trop loin pour l'un, déjà en deçà du suivant : alors celui qui s'en écarte le moins)
    let k = 1
    let x = cible.corps.x
    let y = cible.corps.y
    let ecart = Infinity
    for (let j = 1; j <= hc.rebonds; j++) {
      const p = ouSeraLInsecte(c, m, cible, hc.vol * j)
      const lancer = Math.hypot(p.x - v.x, p.y - v.y) - (j - 1) * hc.bond
      const hors = Math.max(0, lancer - hc.bond, -lancer)
      if (hors < ecart) (ecart = hors), (k = j), (x = p.x), (y = p.y)
      if (hors === 0) break
    }
    const d = Math.hypot(x - v.x, y - v.y)
    const cap = d > 1e-6 ? Math.atan2(y - v.y, x - v.x) : v.cap
    const lancer = Math.max(0, Math.min(hc.bond, d - (k - 1) * hc.bond))
    const x1 = v.x + Math.cos(cap) * lancer
    const y1 = v.y + Math.sin(cap) * lancer
    m.hypercubes.push({ id: m.prochainId++, arme: i, x0: v.x, y0: v.y, x1, y1, depart: m.t, duree: hc.vol, cap, contacts: 0, cible: cible.id, vise: k })
    ev.push({ type: 'hypercube', x: v.x, y: v.y, arme: a.id })
  })
  m.hypercubes = m.hypercubes.filter((h) => {
    const a = c.armes[h.arme]
    const hc = a?.hypercube
    if (a === undefined || hc === undefined) return false
    // (S'IL SUIT SA CIBLE — `suit` : PENDANT LE BOND QUI DOIT LA TOUCHER, son point de chute suit l'insecte visé, là où il
    // sera à la chute ; sinon il file droit)
    const visee = h.cible === null || hc.suit !== true ? undefined : m.ennemis.find((e) => e.id === h.cible)
    if (visee !== undefined && h.contacts + 1 === h.vise) {
      const { x: px, y: py } = ouSeraLInsecte(c, m, visee, Math.max(0, h.depart + h.duree - m.t))
      const l = Math.hypot(px - h.x0, py - h.y0)
      const lm = Math.min(l, hc.bond * 1.25)
      if (l > 1e-6) (h.cap = Math.atan2(py - h.y0, px - h.x0)), (h.x1 = h.x0 + Math.cos(h.cap) * lm), (h.y1 = h.y0 + Math.sin(h.cap) * lm)
    }
    if (m.t < h.depart + h.duree) return true
    // (IL TOUCHE LE SOL : une petite zone de dégâts, plus large à chaque contact)
    h.contacts++
    const rayon = hc.rayon * Math.pow(hc.croissance, h.contacts - 1)
    ev.push({ type: 'rebondHypercube', id: h.id, x: h.x1, y: h.y1, rayon, contact: h.contacts })
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - h.x1, e.corps.y - h.y1) > rayon + rayonDe(c, e)) continue
      const critique = critiqueSur(c, m, a, e, () => tire(m.graine, h.id * 31 + e.id * 7 + h.contacts, 12))
      e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    if (h.contacts >= hc.rebonds) {
      ev.push({ type: 'hypercubeFini', x: h.x1, y: h.y1 })
      return false
    }
    // (IL REBONDIT, plus loin dans le sens de son lancer, d'un bond de la même longueur et de la même durée — S'IL SUIT
    // SA CIBLE, avant le contact visé, réorienté vers là où l'insecte sera à ce contact)
    h.depart += h.duree
    h.duree = hc.vol
    h.x0 = h.x1
    h.y0 = h.y1
    if (visee !== undefined && h.contacts < h.vise) {
      const { x: px, y: py } = ouSeraLInsecte(c, m, visee, (h.vise - h.contacts) * hc.vol)
      if (Math.hypot(px - h.x0, py - h.y0) > 1e-6) h.cap = Math.atan2(py - h.y0, px - h.x0)
    }
    h.x1 = h.x0 + Math.cos(h.cap) * hc.bond
    h.y1 = h.y0 + Math.sin(h.cap) * hc.bond
    return true
  })
}

/** LES ŒUFS DU VER (voir `Arme.ponte`) : la ponte derrière lui, l'éclosion à son heure, les mini-vers qui chassent et mordent. */
function menerLesOeufs(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  const vit = Math.hypot(v.vx, v.vy)
  c.armes.forEach((a, i) => {
    const po = a.ponte
    if (po === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0) || vit < 10) return
    if (m.oeufs.filter((o) => o.arme === i).length >= po.max) return
    m.armesA[i] = m.t + po.tous
    // (derrière lui, au bout de son corps)
    const x = v.x - (v.vx / vit) * 16
    const y = v.y - (v.vy / vit) * 16
    m.oeufs.push({ id: m.prochainId++, arme: i, x, y, cap: v.cap, pondu: m.t })
    ev.push({ type: 'oeuf', x, y })
  })
  // (L'ŒUF ÉCLOT À SON HEURE, qu'il y ait un insecte ou non : ses mini-vers partent en étoile)
  m.oeufs = m.oeufs.filter((o) => {
    const po = c.armes[o.arme]?.ponte
    if (po === undefined || m.phase !== 'vol') return false
    if (m.t - o.pondu < po.eclosion) return true
    for (let k = 0; k < po.nombre; k++) {
      const cap = o.cap + Math.PI + ((k + 0.5) / po.nombre - 0.5) * Math.PI * 1.4
      m.miniVers.push({ id: m.prochainId++, arme: o.arme, x: o.x + Math.cos(cap) * 2, y: o.y + Math.sin(cap) * 2, cap, ne: m.t, cible: null, mordA: m.t })
    }
    ev.push({ type: 'eclosion', id: o.id, x: o.x, y: o.y })
    return false
  })
  m.miniVers = m.miniVers.filter((w) => {
    const po = c.armes[w.arme]?.ponte
    if (po === undefined || m.phase !== 'vol') return false
    if (m.t - w.ne >= po.duree) {
      ev.push({ type: 'miniVerFini', id: w.id, x: w.x, y: w.y })
      return false
    }
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - w.x, e.corps.y - w.y)
    // (SA PROIE : celle qu'il chasse, tant qu'elle vit ; sinon la plus proche à sa vue que ses frères ne chassent pas — à défaut, la plus proche)
    let proie = w.cible === null ? undefined : m.ennemis.find((e) => e.id === w.cible)
    if (proie === undefined) {
      const prises = new Set(m.miniVers.filter((x) => x !== w && x.arme === w.arme).map((x) => x.cible))
      let libre: Ennemi | undefined
      let prise: Ennemi | undefined
      for (const e of m.ennemis) {
        const d = dist(e)
        if (d > po.vue) continue
        if (!prises.has(e.id) && (libre === undefined || d < dist(libre))) libre = e
        if (prise === undefined || d < dist(prise)) prise = e
      }
      proie = libre ?? prise
      w.cible = proie?.id ?? null
    }
    // (il serpente vers elle ; sans proie, il nage en ondulant, plus lentement)
    const voulu = proie === undefined ? w.cap + Math.sin(m.t * 2.5 + w.id) * 1.2 : Math.atan2(proie.corps.y - w.y, proie.corps.x - w.x)
    let e = voulu - w.cap
    while (e > Math.PI) e -= Math.PI * 2
    while (e < -Math.PI) e += Math.PI * 2
    // (sans proie, il vire doucement : à pleine vitesse de virage, il tournait en rond)
    const vire = proie === undefined ? Math.min(po.virage, 1.5) : po.virage
    w.cap += Math.max(-vire * dt, Math.min(vire * dt, e))
    const pas = proie === undefined ? po.vitesse * 0.4 * dt : Math.min(po.vitesse * dt, Math.max(0, dist(proie) - rayonDe(c, proie) - 1))
    w.x += Math.cos(w.cap) * pas
    w.y += Math.sin(w.cap) * pas
    // (AU CONTACT, IL MORD, à sa cadence)
    if (proie !== undefined && dist(proie) <= rayonDe(c, proie) + 3 && m.t >= w.mordA) {
      w.mordA = m.t + po.cadence
      const critique = critiqueTire(c, m, c.armes[w.arme], proie)
      proie.pv -= po.morsure * (critique ? facteurSur(c, m, c.armes[w.arme], proie) : 1)
      ev.push({ type: 'morsureMiniVer', id: proie.id, x: proie.corps.x, y: proie.corps.y })
      ev.push({ type: 'ennemiTouche', id: proie.id, x: proie.corps.x, y: proie.corps.y, critique })
      if (proie.pv <= 0) abattreLEnnemi(c, m, proie, ev)
    }
    return true
  })
}

/** LES INSECTES QUE LE DRAIN D'ÂME TIENT (voir `Arme.drain`) : ceux de ses liens, toujours en vie. Le dessin lit les mêmes. */
export const liesAuDrain = (m: Monde): Ennemi[] => m.liens.flatMap((l) => m.ennemis.filter((e) => e.id === l.cible))

/** LE DRAIN D'ÂME (voir `Arme.drain`) : il accroche les âmes à portée, les draine à toute distance, et ce qui est pris purge la corruption. */
function menerLeDrain(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  if (m.phase !== 'vol') return
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const dr = a.drain
    if (dr === undefined) return
    // (un lien dont l'âme est morte se défait : la place se libère)
    m.liens = m.liens.filter((l) => l.arme !== i || m.ennemis.some((e) => e.id === l.cible))
    const siens = m.liens.filter((l) => l.arme === i).length
    if (siens < (dr.cibles ?? Infinity)) {
      // (LA PORTÉE N'ACCROCHE QUE : le verrouillé d'abord, puis les plus proches, qu'aucun lien ne tient déjà)
      const tenus = new Set(m.liens.map((l) => l.cible))
      const d = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      const dans = m.ennemis.filter((e) => !tenus.has(e.id) && d(e) <= dr.rayon + rayonDe(c, e)).sort((p, q) => d(p) - d(q))
      const ve = ennemiVerrouille(m)
      if (ve !== null && dans.includes(ve)) dans.splice(dans.indexOf(ve), 1), dans.unshift(ve)
      for (const e of dans.slice(0, (dr.cibles ?? Infinity) - siens)) {
        m.liens.push({ arme: i, cible: e.id, depuis: m.t })
        ev.push({ type: 'accroche', id: e.id, x: e.corps.x, y: e.corps.y })
      }
    }
    // (ET LE LIEN TIENT, À TOUTE DISTANCE : l'âme perd sa vie, qui revient au vaisseau)
    for (const l of m.liens.filter((x) => x.arme === i)) {
      const e = m.ennemis.find((x) => x.id === l.cible)
      if (e === undefined) continue
      e.pv -= dr.dps * dt
      // (… PLUS DE PURGE — Keko, 19/11 : « on va supprimer le bonus de purge de l'intrication » : la vie prise ne revient
      // plus au vaisseau ; un insecte qu'elle abat purge comme les autres)
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}

/** LES VRILLES D'OMBRE (voir `Arme.vrille`) : la sortie en un point tiré autour du vaisseau, la saisie, l'étreinte, l'arrachement, la fin. */
function menerLesVrilles(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const vr = a.vrille
    if (vr === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    if (!m.ennemis.some((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e))) return
    m.armesA[i] = m.t + a.cadence
    // (la plus vieille rentre si elles sont déjà toutes sorties)
    const siennes = m.vrilles.filter((r) => r.arme === i)
    if (siennes.length >= vr.max) {
      const vieille = siennes.reduce((x, y) => (y.nee < x.nee ? y : x))
      m.vrilles.splice(m.vrilles.indexOf(vieille), 1)
      ev.push({ type: 'vrilleFinie', id: vieille.id, x: vieille.x, y: vieille.y })
    }
    // (un point tiré au hasard autour du vaisseau, entre `pres` et `loin`)
    const id = m.prochainId++
    const an = tire(m.graine, id, 41) * Math.PI * 2
    const d = vr.pres + (vr.loin - vr.pres) * Math.sqrt(tire(m.graine, id, 42))
    const x = v.x + Math.cos(an) * d
    const y = v.y + Math.sin(an) * d
    m.vrilles.push({ id, arme: i, x, y, nee: m.t, libreA: m.t + vr.sortie, cible: null, saisieA: -1, signaleA: -1 })
    ev.push({ type: 'vrille', id, x, y })
  })
  for (let k = m.vrilles.length - 1; k >= 0; k--) {
    const r = m.vrilles[k]
    const a = c.armes[r.arme]
    const vr = a?.vrille
    if (a === undefined || vr === undefined || m.t - r.nee >= vr.duree || m.phase !== 'vol') {
      m.vrilles.splice(k, 1)
      ev.push({ type: 'vrilleFinie', id: r.id, x: r.x, y: r.y })
      continue
    }
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - r.x, e.corps.y - r.y)
    const allonge = vr.allonge + c.ennemi.rayon
    let proie = r.cible === null ? undefined : m.ennemis.find((e) => e.id === r.cible)
    // (UN GRAND S'ARRACHE : sorti de son allonge, il prend un coup et elle le lâche)
    if (proie !== undefined && dist(proie) > allonge) {
      const critique = critiqueTire(c, m, a, proie)
      proie.pv -= vr.arrache * (critique ? facteurSur(c, m, a, proie) : 1)
      ev.push({ type: 'arrache', id: r.id, x: proie.corps.x, y: proie.corps.y })
      ev.push({ type: 'ennemiTouche', id: proie.id, x: proie.corps.x, y: proie.corps.y, critique })
      if (proie.pv <= 0) abattreLEnnemi(c, m, proie, ev)
      proie = undefined
      r.cible = null
      r.libreA = m.t + 0.3
    }
    if (proie === undefined && r.cible !== null) (r.cible = null), (r.libreA = m.t + 0.2)
    if (proie === undefined) {
      if (m.t < r.libreA) continue
      // (LIBRE, elle saisit : le verrouillé à son allonge, sinon le plus proche d'elle qu'aucune autre ne tient)
      const tenus = new Set(m.vrilles.map((x) => x.cible))
      const ve = ennemiVerrouille(m)
      if (ve !== null && dist(ve) <= allonge && !tenus.has(ve.id)) proie = ve
      else {
        let dc = allonge
        for (const e of m.ennemis) if (!tenus.has(e.id) && dist(e) <= dc) (dc = dist(e)), (proie = e)
      }
      if (proie === undefined) continue
      r.cible = proie.id
      r.saisieA = m.t
      r.signaleA = m.t
      ev.push({ type: 'saisie', id: r.id, cible: proie.id, x: proie.corps.x, y: proie.corps.y })
    }
    // (ELLE SERRE : un petit ne bouge plus ; tous perdent leur vie)
    if (proie.grand !== true) proie.tenuA = m.t + 0.1
    proie.pv -= vr.dps * dt
    if (m.t - r.signaleA >= vr.periode) {
      r.signaleA = m.t
      ev.push({ type: 'serre', id: proie.id, x: proie.corps.x, y: proie.corps.y })
    }
    if (proie.pv <= 0) {
      abattreLEnnemi(c, m, proie, ev)
      r.cible = null
      r.libreA = m.t + 0.2
    }
  }
}

/** LES NUAGES D'INSECTES (voir `Arme.nuee`) : centrés sur le vaisseau, leurs bras qui s'étendent vers les insectes proches, les morsures. */
function menerLesNuees(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const nu = a.nuee
    if (nu === undefined) return
    let n = m.nuees.find((x) => x.arme === i)
    if (n === undefined) {
      n = { arme: i, x: v.x, y: v.y, mordA: m.t, bras: [], croissance: nu.festin?.depart ?? 0 }
      m.nuees.push(n)
    }
    n.x = v.x
    n.y = v.y
    // (vers qui il s'étend : tous les insectes à portée, le verrouillé d'abord)
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    const proches = m.phase === 'vol' ? m.ennemis.filter((e) => dist(e) <= a.portee + rayonDe(c, e)).sort((p, q) => dist(p) - dist(q)) : []
    const ve = ennemiVerrouille(m)
    if (ve !== null && proches.includes(ve)) proches.splice(proches.indexOf(ve), 1), proches.unshift(ve)
    const vises = new Set(proches.map((e) => e.id))
    const pas = dt / nu.deploiement
    // (les bras tendus vers un insecte encore visé s'allongent ; les autres se rétractent, vers le dernier point où il était)
    for (const b of n.bras) {
      const e = vises.has(b.cible) ? m.ennemis.find((x) => x.id === b.cible) : undefined
      if (e !== undefined) (b.u = Math.min(1, b.u + pas)), (b.tx = e.corps.x), (b.ty = e.corps.y)
      else b.u -= pas
    }
    n.bras = n.bras.filter((b) => b.u > 0)
    for (const id of vises) if (!n.bras.some((b) => b.cible === id && vises.has(b.cible))) {
      const e = m.ennemis.find((x) => x.id === id)!
      n.bras.push({ cible: id, u: pas, tx: e.corps.x, ty: e.corps.y })
    }
    if (m.phase !== 'vol') return
    const signale = m.t - n.mordA >= nu.periode
    if (signale) n.mordA = m.t
    // (mordus : tous ceux à portée, tout de suite — ils se partagent le budget de la nuée)
    const mordus = proches
    // (ELLE SE NOURRIT : à chaque morsure, un pas par insecte mordu ; une morsure à vide, elle maigrit)
    const fe = nu.festin
    if (fe !== undefined && signale && mordus.length > 0) n.croissance = Math.min(fe.max, n.croissance + fe.pas * mordus.length)
    if (fe !== undefined && mordus.length === 0) n.croissance = Math.max(0, n.croissance - (fe.max * dt) / fe.fonte)
    for (const e of mordus) {
      e.pv -= ((nu.budget * (1 + n.croissance)) / mordus.length) * dt
      if (signale) ev.push({ type: 'morsure', id: e.id, x: e.corps.x, y: e.corps.y })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}
/**
 * UN MISSILE D'ESSAIM ZIGZAGUE (voir `Arme.essaim`) : vers sa cible — ou, morte, l'insecte le plus proche de lui —, par
 * bonds : à chaque bond un cap neuf, l'écart tiré au hasard d'un bord à l'autre et qui s'éteint avec l'âge.
 */
function traquer(m: Monde, o: Obus, dt: number): void {
  const tq = o.traque
  if (tq === undefined) return
  let cible = m.ennemis.find((e) => e.id === tq.cible)
  if (cible === undefined) {
    // (SA CIBLE EST MORTE — Keko, 16/11 : « ils foncent en ligne droite vers un autre ennemi, parfois assez loin ; ils
    // perdent leur comportement chaotique, ça fait un effet de rebond entre les ennemis, avec une portée très grande » :
    // il ne reprend qu'un insecte à moins de `reprise` de lui — sinon il s'éteint —, et il REPART EN ZIGZAG, sur un
    // calme moitié moins long, avec de quoi voler jusque-là)
    let dc = tq.reprise
    let autre: Ennemi | undefined
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - o.x, e.corps.y - o.y)
      if (d < dc) (dc = d), (autre = e)
    }
    if (autre === undefined) {
      o.vie = Math.min(o.vie, 0.12)
      return
    }
    cible = autre
    tq.cible = autre.id
    tq.depuis = m.t
    o.vie = Math.max(o.vie, tq.calme * 0.5 + 0.3)
  }
  // (le chaos compte depuis le départ — ou depuis la reprise d'une autre cible)
  const age = m.t - (tq.depuis ?? tq.nee)
  const calme = tq.depuis === undefined ? tq.calme : tq.calme * 0.5
  const dx = cible.corps.x - o.x
  const dy = cible.corps.y - o.y
  const sp = Math.min(tq.pointe, tq.v0 + tq.acces * age * age)
  // (le bond en cours, et son écart : d'un côté puis de l'autre, d'une ampleur tirée au hasard, qui s'éteint en `calme`)
  const bond = Math.floor(age / tq.pas)
  const ampleur = tq.chaos * Math.max(0, 1 - age / calme)
  // (un bond sur quatre ne change pas de côté : un crochet, une boucle, pas un zigzag régulier)
  // (repris, ses bonds se tirent sur une autre clé : pas les mêmes écarts qu'au départ)
  const cle = tq.depuis === undefined ? bond : bond + 1000
  const cote = (bond % 2 === 0 ? 1 : -1) * (o.id % 2 === 0 ? 1 : -1) * (tire(m.graine, o.id, 26, cle) < 0.25 ? -1 : 1)
  const ecart = cote * ampleur * (0.35 + 0.65 * tire(m.graine, o.id, 25, cle))
  const voulu = Math.atan2(dy, dx) + ecart
  const k = Math.min(1, tq.braquage * dt)
  o.vx += (Math.cos(voulu) * sp - o.vx) * k
  o.vy += (Math.sin(voulu) * sp - o.vy) * k
}

/** L'instant où le triangle d'une balise s'éteint : `duree` après qu'il est FERMÉ, à la pose de sa troisième balise ; encore ouvert, jamais (voir `Arme.balise`). */
export function finDuTrio(m: Monde, b: Balise, duree: number): number {
  const trio = m.balises.filter((o) => o.trio === b.trio)
  const troisieme = trio.find((o) => o.rang === 2)
  return troisieme === undefined ? Infinity : troisieme.nee + duree
}

/** LES BALISES (voir `Arme.balise`) : la pose sur le passage, l'extinction, les lignes qui s'éclairent quand on les franchit. */
function menerLesBalises(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  // les triangles finis s'éteignent, d'un bloc
  const finis = new Set(m.balises.filter((b) => {
    const ba = c.armes[b.arme]?.balise
    return ba === undefined || m.t >= finDuTrio(m, b, ba.duree)
  }).map((b) => b.trio))
  m.balises = m.balises.filter((b) => {
    if (!finis.has(b.trio)) return true
    ev.push({ type: 'baliseFinie', x: b.x, y: b.y, arme: c.armes[b.arme]?.id ?? '' })
    return false
  })
  c.armes.forEach((a, i) => {
    const ba = a.balise
    if (ba === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const miennes = m.balises.filter((b) => b.arme === i)
    const derniere = miennes[miennes.length - 1]
    const px = v.x + Math.cos(v.cap) * (ba.devant ?? 0)
    const py = v.y + Math.sin(v.cap) * (ba.devant ?? 0)
    if (derniere !== undefined && Math.hypot(derniere.x - px, derniere.y - py) < ba.ecart) return
    m.armesA[i] = m.t + ba.tous
    const rang = derniere === undefined ? 0 : (derniere.rang + 1) % 3
    const liens: Balise['liens'] = []
    if (derniere !== undefined && rang > 0) liens.push({ vers: derniere.id, sur: [], dechargeA: 0 })
    // (LE TRIANGLE : la troisième d'un trio est reliée aussi à la première, si elle est encore là)
    const premiere = miennes[miennes.length - 2]
    if (rang === 2 && derniere?.rang === 1 && premiere?.rang === 0) liens.push({ vers: premiere.id, sur: [], dechargeA: 0 })
    const id = m.prochainId++
    m.balises.push({ id, x: px, y: py, nee: m.t, arme: i, rang, trio: rang === 0 || derniere === undefined ? id : derniere.trio, liens })
    ev.push({ type: 'balisePosee', x: px, y: py, arme: a.id })
    // (trop de balises : le plus vieux triangle saute, entier)
    if (ba.max !== undefined && miennes.length + 1 > ba.max) {
      const vieux = miennes[0].trio
      for (const b of m.balises) if (b.trio === vieux) ev.push({ type: 'baliseFinie', x: b.x, y: b.y, arme: a.id })
      m.balises = m.balises.filter((b) => b.trio !== vieux)
    }
  })
  // LE PIÈGE : chaque insecte qui ENTRE sur une ligne l'éclaire, et tous ceux qui sont dessus prennent un coup ; tant
  // qu'il en reste dessus, elle redécharge toutes les `periode` secondes
  for (const b of m.balises) for (const li of b.liens) {
    const a = c.armes[b.arme]
    const ba = a?.balise
    const autre = m.balises.find((o) => o.id === li.vers)
    if (a === undefined || ba === undefined || autre === undefined) continue
    const dx = autre.x - b.x
    const dy = autre.y - b.y
    const l2 = dx * dx + dy * dy || 1
    const dessus = m.ennemis.filter((e) => {
      const u = ((e.corps.x - b.x) * dx + (e.corps.y - b.y) * dy) / l2
      return u > 0 && u < 1 && Math.hypot(b.x + dx * u - e.corps.x, b.y + dy * u - e.corps.y) <= ba.garde + rayonDe(c, e)
    })
    let decharges = dessus.filter((e) => !li.sur.includes(e.id)).length
    if (decharges === 0 && dessus.length > 0 && m.t >= li.dechargeA) decharges = 1
    li.sur = dessus.map((e) => e.id)
    if (decharges > 0) li.dechargeA = m.t + ba.periode
    // (UN FAISCEAU DE CRISTAUX BRÛLE TANT QU'ON EST DESSUS, ET RIEN APRÈS — Keko, 16/11 : « on ne veut pas de dégâts sur la
    // durée : il subit des dégâts tant qu'il touche le trait, sinon rien » : `dps` par seconde, à chaque instant passé dessus)
    if (ba.irradie !== undefined)
      for (const e of dessus) {
        if (!m.ennemis.includes(e)) continue
        e.pv -= ba.irradie.dps * dt
        e.irradie = { jusque: m.t + 0.12 }
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    for (let k = 0; k < decharges; k++) {
      ev.push({ type: 'ligne', x0: b.x, y0: b.y, x1: autre.x, y1: autre.y, arme: a.id })
      for (const e of dessus) {
        if (!m.ennemis.includes(e)) continue
        const critique = critiqueSur(c, m, a, e, () => tire(m.graine, m.prochainId++, 12))
        e.pv -= a.degats * (critique ? facteurSur(c, m, a, e) : 1)
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    }
  }
}

/** LE RAYON CANALISÉ (voir `Arme.canalise`) : il choisit sa cible, chauffe sur elle, la brûle. */
function canaliserLeRayon(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const i = c.armes.findIndex((a) => a.canalise !== undefined)
  const a = c.armes[i]
  const ca = a?.canalise
  if (a === undefined || ca === undefined) {
    m.canal = null
    return
  }
  const v = m.vaisseau
  const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
  let cible: Ennemi | undefined
  const ve = ennemiVerrouille(m)
  if (ve !== null && aPortee(ve)) cible = ve
  else if (m.canal !== null) cible = m.ennemis.find((e) => e.id === m.canal!.cible && aPortee(e))
  if (cible === undefined) {
    let dc = Infinity
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      if (aPortee(e) && d < dc) (dc = d), (cible = e)
    }
  }
  if (cible === undefined) {
    m.canal = null
    return
  }
  const depuis = m.canal !== null && m.canal.cible === cible.id ? m.canal.depuis : m.t
  m.canal = { arme: i, cible: cible.id, depuis, x: cible.corps.x, y: cible.corps.y, chauffe: 1 }
  cible.pv -= ca.dps * dt
  brulerAuContact(c, m, cible, ca.brulure, ca.dpsBrulure)
  if (cible.pv <= 0) {
    abattreLEnnemi(c, m, cible, ev)
    m.canal = null
  }
}

/** LES RAYONS CONCENTRÉS (voir `Arme.concentre`) : chacun ronge sa cible, et s'éteint au bout de sa durée, sa cible morte ou trop loin. */
function concentrerLesFaisceaux(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  m.faisceaux = m.faisceaux.filter((f) => {
    const a = c.armes[f.arme]
    const co = a?.concentre
    if (a === undefined || co === undefined || m.phase !== 'vol' || m.t - f.nee >= co.duree) return false
    const e = m.ennemis.find((x) => x.id === f.cible)
    if (e === undefined || Math.hypot(e.corps.x - v.x, e.corps.y - v.y) > a.portee * 1.5 + rayonDe(c, e)) return false
    const ronge = f.dps * Math.min(dt, co.duree - (m.t - dt - f.nee))
    const toucher = (x: Ennemi, part: number): void => {
      x.pv -= ronge * part
      if (a.gel !== undefined) geler(c, m, x, 0.3, a.gel.ralenti, ev)
      if (a.incendiaire !== undefined) enflammer(c, m, x, a.incendiaire)
      if (a.corrosif !== undefined) ronger(c, m, x, { ...a.corrosif, dps: 0 }, ev)
    }
    // (SA ZONE, CONTINUE — la carte « Impulsion », Keko, 23/11 : « si on a déjà la concentration, la zone autour de
    // l'ennemi touché devient une zone continue qui dure tout le temps du laser » : tout ce qui est autour d'un insecte que le
    // rayon ronge perd `zone.part` de ce qu'il ronge)
    const zonePerdue: Ennemi[] = []
    const autour = (x: Ennemi, part: number): void => {
      if (a.zone === undefined) return
      for (const g of m.ennemis) {
        if (g === x || Math.hypot(g.corps.x - x.corps.x, g.corps.y - x.corps.y) > a.zone.rayon + rayonDe(c, g)) continue
        g.pv -= ronge * part * (a.zone.part ?? 1)
        // (la zone continue ronge aussi, avec la Corrosion — Keko, 23/11)
        if (a.corrosif !== undefined) ronger(c, m, g, { ...a.corrosif, dps: 0 }, ev)
        zonePerdue.push(g)
      }
    }
    toucher(e, 1)
    autour(e, 1)
    // (LE RAYON QUI RICOCHE — voir `Arme.concentre` : de proche en proche, jamais sur celui qu'il quitte)
    f.chaine = []
    if (a.ricochet !== undefined) {
      let ici = e
      let part = 1
      for (let n = 0; n < a.ricochet.rebonds; n++) {
        let suite: Ennemi | null = null
        let ds = a.ricochet.portee
        for (const g of m.ennemis) {
          if (g === ici || g.asteroide !== undefined) continue
          const d = Math.hypot(g.corps.x - ici.corps.x, g.corps.y - ici.corps.y)
          if (d < ds) (ds = d), (suite = g)
        }
        if (suite === null) break
        part *= a.ricochet.part
        toucher(suite, part)
        autour(suite, part)
        f.chaine.push(suite.id)
        ici = suite
      }
    }
    for (const x of [e, ...f.chaine.map((id) => m.ennemis.find((g) => g.id === id)), ...zonePerdue]) if (x !== undefined && x.pv <= 0) abattreLEnnemi(c, m, x, ev)
    return e.pv > 0
  })
}
/** UN SILLON ÉLECTRIQUE (voir `Arme.sillon`) : la balle qui le trace, sa course, sa naissance et sa durée, ce qu'il fait, son gel. */
// (`parSegment` : chaque bout s'éteint `duree` après sa pose, `t` — la traînée d'une boule tesla, voir `Arme.sphere.trainee`)
export type Sillon = { parSegment?: boolean; balle: number; segments: { x0: number; y0: number; x1: number; y1: number; t?: number }[]; nee: number; duree: number; dps: number; largeur: number; gel?: { duree: number; ralenti: number }; electrocution?: { duree: number; chance: number; degats: number; saut: number } }
/** LES SILLONS (voir `Arme.sillon`) : tout insecte dedans perd leurs dégâts par seconde, une fois par sillon, et gèle s'il gèle ; puis ils s'éteignent. */
function menerLesSillons(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  // (une traînée de boule : ses bouts s'éteignent un à un ; elle reste tant qu'il en reste, ou que sa boule vit)
  m.sillons = m.sillons.filter((si) => {
    if (m.phase !== 'vol') return false
    if (si.parSegment !== true) return m.t - si.nee < si.duree
    si.segments = si.segments.filter((g) => m.t - (g.t ?? si.nee) < si.duree)
    return si.segments.length > 0 || m.spheres.some((s) => s.id === si.balle)
  })
  if (m.sillons.length === 0) return
  const touches: Ennemi[] = []
  for (const si of m.sillons)
    for (const e of m.ennemis) {
      if (e.asteroide !== undefined) continue
      const r = rayonDe(c, e) + si.largeur
      if (!si.segments.some((g) => distanceAuSegment(e.corps.x, e.corps.y, g.x0, g.y0, g.x1, g.y1) <= r)) continue
      e.pv -= si.dps * dt
      if (si.gel !== undefined) geler(c, m, e, si.gel.duree, si.gel.ralenti, ev)
      // (un sillon électrique électrocute — la carte « Électrique » du railgun ; ses dégâts, sans cesse, ne font pas sauter d'arc)
      if (si.electrocution !== undefined) electrocuter(c, m, e, si.electrocution, ev)
      touches.push(e)
    }
  for (const e of touches) if (e.pv <= 0 && m.ennemis.includes(e)) abattreLEnnemi(c, m, e, ev)
}
/** Une balise laser de l'Empire (voir `Arme.lien`) : en vol, son élan et son temps de vol ; posée, l'instant où elle s'est posée. */
export type BaliseLaser = { arme: number; x: number; y: number; vx: number; vy: number; nee: number; vol: number; posee: number | null }
/** CE QUE LE RAYON D'UNE BALISE LASER TRAVERSE (voir `Arme.lien`) : du vaisseau à elle, à son épaisseur. */
export function ennemisDuLien(c: ConfigVaisseau, m: Monde, b: BaliseLaser): Ennemi[] {
  const li = c.armes[b.arme]?.lien
  if (li === undefined || b.posee === null) return []
  const v = m.vaisseau
  return m.ennemis.filter((e) => distanceAuSegment(e.corps.x, e.corps.y, v.x, v.y, b.x, b.y) <= li.epaisseur + rayonDe(c, e))
}
/** LES BALISES LASER (voir `Arme.lien`) : lancées vers un insecte, elles freinent et tiennent ; le rayon brûle ce qu'il traverse. */
function menerLesBalisesLaser(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const li = a.lien
    if (li === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0) || m.balisesLaser.some((b) => b.arme === i)) return
    // (vers le verrouillé à portée, sinon l'insecte le plus proche ; une roche sans insecte)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
    const dist = (e: Ennemi): number => Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    let cible: Ennemi | null = null
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    for (const insecte of [true, false]) if (cible === null) for (const e of m.ennemis) if ((e.asteroide === undefined) === insecte && aPortee(e) && (cible === null || dist(e) < dist(cible))) cible = e
    if (cible === null) return
    const an = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    const x0 = v.x + Math.cos(an) * (c.rayon + 2)
    const y0 = v.y + Math.sin(an) * (c.rayon + 2)
    // (lancée en cloche pour se poser un peu au-delà de lui, à la portée au plus, au bout de son vol)
    const loin = Math.max(0, Math.min(a.portee, dist(cible) + 20) - c.rayon - 2)
    m.balisesLaser.push({ arme: i, x: x0, y: y0, vx: (Math.cos(an) * loin) / li.vol, vy: (Math.sin(an) * loin) / li.vol, nee: m.t, vol: li.vol, posee: null })
    m.armesA[i] = m.t + a.cadence
    ev.push({ type: 'tourelleLancee', x: x0, y: y0 })
  })
  for (let j = m.balisesLaser.length - 1; j >= 0; j--) {
    const b = m.balisesLaser[j]
    const a = c.armes[b.arme]
    const li = a?.lien
    if (a === undefined || li === undefined || m.phase !== 'vol') {
      m.balisesLaser.splice(j, 1)
      continue
    }
    // (EN VOL : elle file, ne touche rien ; au bout de son vol, elle se pose, et s'active)
    if (b.posee === null) {
      // (le temps de vol de ce pas : de sa naissance au plus tôt, jusqu'à son atterrissage au plus tard)
      const pas = Math.max(0, Math.min(m.t, b.nee + b.vol) - Math.max(m.t - dt, b.nee))
      b.x += b.vx * pas
      b.y += b.vy * pas
      if (m.t - b.nee >= b.vol - 1e-9) {
        b.posee = m.t
        b.vx = 0
        b.vy = 0
        ev.push({ type: 'balisePosee', x: b.x, y: b.y, arme: a.id })
      }
      continue
    }
    if (m.t - b.posee >= li.duree) {
      if (li.explosion !== undefined) exploser(c, m, b.x, b.y, { rayon: li.explosion.rayon, degats: a.degats * li.explosion.part }, null, ev, a.id)
      ev.push({ type: 'baliseFinie', x: b.x, y: b.y, arme: a.id })
      m.balisesLaser.splice(j, 1)
      continue
    }
    for (const e of ennemisDuLien(c, m, b)) {
      e.pv -= a.degats * dt
      if (a.gel !== undefined) geler(c, m, e, 0.3, a.gel.ralenti, ev)
      if (a.incendiaire !== undefined) enflammer(c, m, e, a.incendiaire)
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}
/** Un harpon de l'Empire (voir `Arme.harpon`) : son arme, où il est, sa cible, l'instant où il s'est planté, ce qu'il peut encore voler. */
export type Harpon = { arme: number; x: number; y: number; vx: number; vy: number; cible: number; plante: number | null; reste: number }
/** LES HARPONS (voir `Arme.harpon`) : ils partent, suivent leur cible, s'y plantent, la rongent de plus en plus fort, cassent. */
function harponner(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const hp = a.harpon
    if (hp === undefined) return
    const h = m.harpons.find((x) => x.arme === i)
    if (h === undefined) {
      if (m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
      // (sa cible : le verrouillé à portée ; sinon l'insecte qui a le plus de points de vie — un qu'aucun autre harpon ne
      // tient, s'il y en a ; une roche sans insecte)
      const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + rayonDe(c, e)
      const tenus = new Set(m.harpons.map((x) => x.cible))
      let cible: Ennemi | null = null
      const ve = ennemiVerrouille(m)
      if (ve !== null && aPortee(ve)) cible = ve
      for (const libre of [true, false]) if (cible === null) for (const e of m.ennemis) if (e.asteroide === undefined && aPortee(e) && (!libre || !tenus.has(e.id)) && (cible === null || e.pv > cible.pv)) cible = e
      if (cible === null) for (const e of m.ennemis) if (aPortee(e) && (cible === null || Math.hypot(e.corps.x - v.x, e.corps.y - v.y) < Math.hypot(cible.corps.x - v.x, cible.corps.y - v.y))) cible = e
      if (cible === null) return
      const an = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
      const x0 = v.x + Math.cos(an) * (c.rayon + 2)
      const y0 = v.y + Math.sin(an) * (c.rayon + 2)
      m.harpons.push({ arme: i, x: x0, y: y0, vx: Math.cos(an) * hp.vitesse, vy: Math.sin(an) * hp.vitesse, cible: cible.id, plante: null, reste: a.portee * 2 })
      ev.push({ type: 'obus', x: x0, y: y0, arme: a.id })
      return
    }
    const e = m.ennemis.find((x) => x.id === h.cible)
    const casse = (): void => {
      m.harpons = m.harpons.filter((x) => x !== h)
      m.armesA[i] = m.t + a.cadence
      ev.push({ type: 'harponCasse', x: h.x, y: h.y })
    }
    if (e === undefined || m.phase !== 'vol') return casse()
    if (h.plante === null) {
      // (il file droit sur sa cible, là où elle est)
      const dx = e.corps.x - h.x
      const dy = e.corps.y - h.y
      const d = Math.hypot(dx, dy) || 1
      const pas = hp.vitesse * dt
      if (d <= pas + rayonDe(c, e)) {
        h.plante = m.t
        h.x = e.corps.x
        h.y = e.corps.y
        ev.push({ type: 'harponPlante', x: e.corps.x, y: e.corps.y, id: e.id })
        const critique = critiqueTire(c, m, a, e)
        e.pv -= a.degats * hp.impact * (critique ? facteurSur(c, m, a, e) : 1)
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) {
          if (a.fragments !== undefined) fragmenter(m, e.corps.x, e.corps.y, a.fragments, e)
          abattreLEnnemi(c, m, e, ev)
          casse()
        }
        return
      }
      h.vx = (dx / d) * hp.vitesse
      h.vy = (dy / d) * hp.vitesse
      h.x += h.vx * dt
      h.y += h.vy * dt
      h.reste -= pas
      if (h.reste <= 0) casse()
      return
    }
    h.x = e.corps.x
    h.y = e.corps.y
    if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) > a.portee * hp.rupture + rayonDe(c, e)) return casse()
    const part = Math.min(1, (m.t - h.plante) / hp.montee)
    e.pv -= a.degats * (1 + (hp.max - 1) * part) * dt
    // (les cartes : le câble gèle et ralentit, enflamme ce qu'il tient ; à sa mort, des éclats)
    if (a.gel !== undefined) geler(c, m, e, 0.3, a.gel.ralenti, ev)
    if (a.incendiaire !== undefined) enflammer(c, m, e, a.incendiaire)
    if (e.pv <= 0) {
      if (a.fragments !== undefined) fragmenter(m, e.corps.x, e.corps.y, a.fragments, e)
      abattreLEnnemi(c, m, e, ev)
      casse()
    }
  })
  // (une arme partie — l'équipement changé —, son harpon avec)
  m.harpons = m.harpons.filter((h) => c.armes[h.arme]?.harpon !== undefined)
}

/** L'ANGLE DU RAYON (voir `Arme.balayage`), à l'instant du monde, pendant son tour ; son départ et son sens ; null hors d'un tour. */
export function angleDuBalayage(c: ConfigVaisseau, m: Monde): { angle: number; part: number; longueur: number; depart: number; sens: number } | null {
  const b = m.balayage
  const a = b === null ? undefined : c.armes[b.arme]?.balayage
  if (b === null || a === undefined) return null
  const part = Math.min(1, (m.t - b.debut) / a.duree)
  if (b.ligne !== undefined) return null
  return { angle: b.depart + b.sens * part * (a.arc ?? 2 * Math.PI), part, longueur: a.longueur, depart: b.depart, sens: b.sens }
}
/** LE POINT D'IMPACT D'UN RAYON QUI TRACE (voir `Arme.balayage.trace`) : où il touche le sol, sa part du trait, le trait ; null hors d'un trait. */
export function impactDuRayon(c: ConfigVaisseau, m: Monde): { x: number; y: number; part: number; ligne: { x0: number; y0: number; x1: number; y1: number } } | null {
  const b = m.balayage
  const a = b === null ? undefined : c.armes[b.arme]?.balayage
  if (b === null || a === undefined || b.ligne === undefined) return null
  const part = Math.min(1, (m.t - b.debut) / a.duree)
  const l = b.ligne
  return { x: l.x0 + (l.x1 - l.x0) * part, y: l.y0 + (l.y1 - l.y0) * part, part, ligne: l }
}

/** LE RAYON (voir `Arme.balayage`) : il part à l'heure, si un ennemi est à portée ; il balaie son arc ; ce qu'il balaie brûle ; il sème sa traînée de feu. */
function menerLeRayon(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  // (le dernier insecte vu à sa portée — le plus proche —, pour qu'un rayon annoncé parte même s'il vient de mourir)
  for (const a of c.armes) {
    if (a.balayage === undefined) continue
    let proche: Ennemi | undefined
    for (const e of m.ennemis) if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.balayage.longueur + rayonDe(c, e) && (proche === undefined || Math.hypot(e.corps.x - v.x, e.corps.y - v.y) < Math.hypot(proche.corps.x - v.x, proche.corps.y - v.y))) proche = e
    if (proche !== undefined) m.rayonVu = { x: proche.corps.x, y: proche.corps.y, t: m.t }
  }
  c.armes.forEach((a, i) => {
    const bl = a.balayage
    if (bl === undefined || m.balayage !== null || m.t < (m.armesA[i] ?? 0)) return
    const enVue = m.ennemis.filter((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= bl.longueur + rayonDe(c, e))
    // (UN RAYON ANNONCÉ VA AU BOUT — Keko, 18/11 : « le bruit du rayon se lance, mais pas le rayon ; dès qu'on commence un
    // rayon, il faut aller jusqu'au bout » — mesuré : la page joue son son d'avance, jusqu'à 0,25 s, dès qu'un insecte est à
    // portée ; mort ou sorti entre-temps, le rayon ne partait plus, 6 % des fois. S'il a vu un insecte à portée dans la
    // demi-seconde, il part vers là où il l'a vu)
    const vu = m.rayonVu
    const aPortee = enVue.length > 0 ? enVue : vu !== null && m.t - vu.t <= 0.5 ? [{ id: -1, corps: { ...v, x: vu.x, y: vu.y, vx: 0, vy: 0 }, pv: Infinity, fait: 'marche', roche: null, forage: null, tirA: 1e9, butin: 0, cargaison: { fer: 0, or: 0, cristal: 0 } } as Ennemi] : []
    if (aPortee.length === 0) return
    const arc = bl.arc ?? 2 * Math.PI
    let depart = bl.depart
    // (son sens, d'un côté ou de l'autre, tiré de l'instant où il part : sans mémoire, il varie d'un balayage à l'autre)
    const sens = bl.vise === true ? (Math.round(m.t * 10) % 2 === 0 ? 1 : -1) : 1
    if (bl.vise === true) {
      let proche = aPortee[0]
      for (const e of aPortee) if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) < Math.hypot(proche.corps.x - v.x, proche.corps.y - v.y)) proche = e
      depart = Math.atan2(proche.corps.y - v.y, proche.corps.x - v.x) - (sens * arc) / 2
    }
    m.balayage = { arme: i, debut: m.t, angle: depart, touches: [], depart, sens, posees: 0 }
    // (le trait au sol : sur la droite du vaisseau à l'insecte le plus proche, d'en deçà de lui à au-delà — jamais sous le vaisseau)
    if (bl.trace !== undefined) {
      let proche = aPortee[0]
      for (const e of aPortee) if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) < Math.hypot(proche.corps.x - v.x, proche.corps.y - v.y)) proche = e
      const d = Math.hypot(proche.corps.x - v.x, proche.corps.y - v.y)
      const ux = d > 0 ? (proche.corps.x - v.x) / d : Math.cos(v.cap)
      const uy = d > 0 ? (proche.corps.y - v.y) / d : Math.sin(v.cap)
      if (bl.trace.travers === true) {
        // (sa droite, vu du vaisseau qui regarde l'insecte : y vers le bas)
        const [dx, dy] = [-uy, ux]
        const { x, y } = proche.corps
        m.balayage.ligne = { x0: x - dx * bl.trace.avant, y0: y - dy * bl.trace.avant, x1: x + dx * bl.trace.apres, y1: y + dy * bl.trace.apres }
      } else {
        const de = Math.max(c.ennemi.rayon, d - bl.trace.avant)
        const a = d + bl.trace.apres
        m.balayage.ligne = { x0: v.x + ux * de, y0: v.y + uy * de, x1: v.x + ux * a, y1: v.y + uy * a }
      }
      m.balayage.suivi = { id: proche.id, x: proche.corps.x, y: proche.corps.y }
    }
    ev.push({ type: 'balayage', duree: bl.duree, arme: a.id })
  })
  const b = m.balayage
  const bl = b === null ? undefined : c.armes[b.arme]?.balayage
  if (b === null || bl === undefined) return
  if (b.ligne !== undefined && bl.trace !== undefined) {
    // LE TRAIT SUIT SA CIBLE (Keko, 16/11 : « le vaisseau manque souvent la cible… alors que dans l'autre sens non » — en
    // travers, l'insecte qui marche sort du trait posé où il était) : tant qu'elle vit, le trait glisse avec elle
    const l = b.ligne
    const s = b.suivi
    const suivie = s === undefined ? undefined : m.ennemis.find((e) => e.id === s.id)
    if (s !== undefined && suivie !== undefined) {
      const [dx, dy] = [suivie.corps.x - s.x, suivie.corps.y - s.y]
      ;(l.x0 += dx), (l.y0 += dy), (l.x1 += dx), (l.y1 += dy)
      ;(s.x = suivie.corps.x), (s.y = suivie.corps.y)
    }
    // LE POINT D'IMPACT frappe ce qui est sous lui — une fois par trait —, sème sa traînée sur le trait parcouru
    const part = Math.min(1, (m.t - b.debut) / bl.duree)
    const ix = l.x0 + (l.x1 - l.x0) * part
    const iy = l.y0 + (l.y1 - l.y0) * part
    for (const e of [...m.ennemis]) {
      if (b.touches.includes(e.id) || Math.hypot(e.corps.x - ix, e.corps.y - iy) > bl.trace.rayon + rayonDe(c, e)) continue
      b.touches.push(e.id)
      const critique = critiqueTire(c, m, c.armes[b.arme], e)
      e.pv -= bl.degats * (critique ? facteurSur(c, m, c.armes[b.arme], e) : 1)
      brulerAuContact(c, m, e, bl.brulure, bl.dpsBrulure)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    const tr = bl.trainee
    if (tr !== undefined) {
      const long = Math.hypot(l.x1 - l.x0, l.y1 - l.y0)
      const faites = Math.floor((part * long) / tr.pas + 1e-9)
      for (; b.posees <= faites; b.posees++) {
        const u = Math.min(1, (b.posees * tr.pas) / Math.max(1, long))
        m.flaques.push({ id: m.prochainId++, x: l.x0 + (l.x1 - l.x0) * u, y: l.y0 + (l.y1 - l.y0) * u, nee: m.t, rayon: tr.rayon, duree: tr.duree, dps: tr.dps, brulure: tr.brulure, dpsBrulure: tr.dpsBrulure })
      }
    }
    if (part >= 1) {
      m.armesA[b.arme] = m.t + bl.tous
      m.balayage = null
    }
    return
  }
  const arc = bl.arc ?? 2 * Math.PI
  const part = Math.min(1, (m.t - b.debut) / bl.duree)
  const avant = b.angle
  const apres = b.depart + b.sens * part * arc
  b.angle = apres
  // (balayé : son angle est entre l'angle d'avant et celui d'après, dans le sens du balayage, à sa largeur près)
  const de = b.sens > 0 ? avant : apres
  const ouverture = Math.abs(apres - avant)
  for (const e of [...m.ennemis]) {
    if (b.touches.includes(e.id)) continue
    const dx = e.corps.x - v.x
    const dy = e.corps.y - v.y
    const d = Math.hypot(dx, dy)
    if (d > bl.longueur + rayonDe(c, e)) continue
    const marge = Math.atan2(rayonDe(c, e), Math.max(1, d))
    let ecart = (Math.atan2(dy, dx) - de) % (2 * Math.PI)
    if (ecart < -marge) ecart += 2 * Math.PI
    if (ecart > ouverture + marge) continue
    b.touches.push(e.id)
    const critique = critiqueTire(c, m, c.armes[b.arme], e)
    e.pv -= bl.degats * (critique ? facteurSur(c, m, c.armes[b.arme], e) : 1)
    brulerAuContact(c, m, e, bl.brulure, bl.dpsBrulure)
    ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
  // (LA TRAÎNÉE : tous les `pas` radians balayés, des flaques de feu le long du rayon)
  const tr = bl.trainee
  if (tr !== undefined) {
    const faites = Math.floor((part * arc) / tr.pas + 1e-9)
    for (; b.posees <= faites; b.posees++) {
      const an = b.depart + b.sens * b.posees * tr.pas
      for (const u of tr.distances ?? [1]) {
        const x = v.x + Math.cos(an) * bl.longueur * u
        const y = v.y + Math.sin(an) * bl.longueur * u
        m.flaques.push({ id: m.prochainId++, x, y, nee: m.t, rayon: tr.rayon, duree: tr.duree, dps: tr.dps, brulure: tr.brulure, dpsBrulure: tr.dpsBrulure })
      }
    }
  }
  if (part >= 1) {
    m.armesA[b.arme] = m.t + bl.tous
    m.balayage = null
  }
}
/** LES FLAQUES DE NAPALM brûlent ce qui est dedans (voir `Arme.napalm`) ; elles s'éteignent au bout de leur durée. */
function brulerLesFlaques(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  m.flaques = m.flaques.filter((f) => m.t - f.nee < f.duree)
  if (m.flaques.length === 0) return
  for (const e of [...m.ennemis]) {
    // (plusieurs flaques ne s'additionnent pas : la plus forte)
    let f: Flaque | undefined
    for (const g of m.flaques) if (Math.hypot(e.corps.x - g.x, e.corps.y - g.y) <= g.rayon + rayonDe(c, e) * 0.5 && (f === undefined || g.dps > f.dps)) f = g
    if (f === undefined) continue
    e.pv -= f.dps * dt
    brulerAuContact(c, m, e, f.brulure, f.dpsBrulure)
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** UNE EXPLOSION DE ZONE (voir `Arme.zone`) : tout ennemi à moins du rayon — sauf celui qu'on vient de toucher — en perd. */
/** La distance du point (x, y) au segment de (x0, y0) à (x1, y1). */
function distanceAuSegment(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0
  const dy = y1 - y0
  const l2 = dx * dx + dy * dy
  const u = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2))
  return Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u))
}
/** CE QU'UN TIR EMPORTE DE SON ARME : sa zone, et ce que les cartes spéciales lui ont donné (voir `Arme.ajoutee`). */
function effetsDuTir(a: Arme): Partial<Obus> {
  return {
    ...(a.zone === undefined ? {} : { zone: { rayon: a.zone.rayon, degats: a.degats * (a.zone.part ?? 1) } }),
    ...(a.perforant === true ? { perce: [] } : {}),
    ...(a.balle === undefined ? {} : { balle: { ...a.balle } }),
    ...(a.ricochet === undefined ? {} : { rebonds: { n: a.ricochet.rebonds, portee: a.ricochet.portee, part: a.ricochet.part } }),
    ...(a.incendiaire === undefined ? {} : { brule: { ...a.incendiaire } }),
    ...(a.fragments === undefined ? {} : { fragments: { ...a.fragments } }),
    ...(a.gel === undefined ? {} : { gel: { ...a.gel } }),
    ...(a.corrosif === undefined ? {} : { ronge: { ...a.corrosif } }),
    ...(a.electrocution === undefined ? {} : { electrocution: { ...a.electrocution } }),
    ...(a.detonation === undefined ? {} : { detonation: { ...a.detonation } }),
    ...(a.execute === true ? { execute: true } : {}),
    ...(a.sillon === undefined ? {} : { sillon: { duree: a.sillon.duree, dps: a.degats * a.sillon.part, largeur: a.sillon.largeur, ...(a.gel === undefined ? {} : { gel: { ...a.gel } }), ...(a.electrocution === undefined ? {} : { electrocution: { ...a.electrocution } }) } }),
  }
}
/** CE QU'UN COUP SANS OBUS FAIT EN PLUS (le rail, l'arc) : le feu, le gel, les éclats — voir les cartes spéciales. */
function effetsDuCoup(c: ConfigVaisseau, m: Monde, a: Arme, e: Ennemi, ev: Evenement[]): void {
  if (a.incendiaire !== undefined) enflammer(c, m, e, a.incendiaire)
  if (a.gel !== undefined) geler(c, m, e, a.gel.duree, a.gel.ralenti, ev, true)
  if (a.electrocution !== undefined) electrocuter(c, m, e, a.electrocution, ev, true)
  if (a.fragments !== undefined) fragmenter(m, e.corps.x, e.corps.y, a.fragments, e)
}
/** Un ennemi touché par un tir qui enflamme (voir `Arme.incendiaire`) : il brûle, le plus fort l'emporte. */
function enflammer(c: ConfigVaisseau, m: Monde, e: Ennemi, b: { duree: number; dps: number }): void {
  const brule = (e.bruleA ?? -1) > m.t
  e.dpsBrulure = brule ? Math.max(e.dpsBrulure ?? 0, brulureDEtat(c, b.dps)) : brulureDEtat(c, b.dps)
  e.bruleA = Math.max(e.bruleA ?? -1, m.t + dureeDEtat(c, b.duree))
  e.dureeBrulure = dureeDEtat(c, b.duree)
}
/** LES ÉCLATS D'UNE EXPLOSION (voir `Arme.fragments`) : tout autour, des balles brûlantes qui traversent, une fois chacun. */
function fragmenter(m: Monde, x: number, y: number, f: { nombre: number; degats: number; vitesse: number; vie: number }, touche: Ennemi | null): void {
  const deja = touche === null ? [] : [touche.id]
  const a0 = tire(m.graine, m.prochainId, 71) * Math.PI * 2
  for (let k = 0; k < f.nombre; k++) {
    const an = a0 + (k / f.nombre) * Math.PI * 2
    m.obus.push({ id: m.prochainId++, x, y, vx: Math.cos(an) * f.vitesse, vy: Math.sin(an) * f.vitesse, vie: f.vie, degats: f.degats, guide: false, arme: 'mitraille', perce: deja })
  }
}
function exploser(c: ConfigVaisseau, m: Monde, x: number, y: number, zone: { rayon: number; degats: number }, touche: Ennemi | null, ev: Evenement[], arme?: string, detonation = false): void {
  // (une détonation sur coup critique a son événement à elle — voir `Arme.detonation`)
  ev.push(detonation ? { type: 'detonation', x, y, rayon: zone.rayon } : { type: 'explosionDeZone', x, y, rayon: zone.rayon, ...(arme === undefined ? {} : { arme }) })
  const a = c.armes.find((x) => x.id === arme)
  for (const e of [...m.ennemis]) {
    if (e === touche || Math.hypot(e.corps.x - x, e.corps.y - y) > zone.rayon + rayonDe(c, e)) continue
    // (L'ARME QUI RONGE RONGE AUSSI PAR SES EXPLOSIONS — Keko, 23/11 : « toutes les variations du laser appliquent corrosion
    // si on a la variation Corrosion » : l'onde de l'Impulsion, à chaque impact et à chaque rebond, la Détonation)
    if (a?.corrosif !== undefined) ronger(c, m, e, { ...a.corrosif, dps: 0 }, ev)
    const critique = critiqueTire(c, m, a, e)
    e.pv -= zone.degats * (critique ? facteurSur(c, m, a, e) : 1)
    ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LA PLACE D'UN DRONE au repos, à l'instant du monde : sur son orbite autour du vaisseau — ou à sa place dans la formation. */
export function placeDuDrone(m: Monde, arme: Arme): Vecteur {
  const o = arme.orbite
  if (o === undefined) return { x: m.vaisseau.x, y: m.vaisseau.y }
  if (o.formation !== undefined) {
    const v = m.vaisseau
    const f = o.formation
    return { x: v.x + Math.cos(v.cap) * f.x - Math.sin(v.cap) * f.y, y: v.y + Math.sin(v.cap) * f.x + Math.cos(v.cap) * f.y }
  }
  const a = o.phase + o.vitesse * m.t
  return { x: m.vaisseau.x + Math.cos(a) * o.rayon, y: m.vaisseau.y + Math.sin(a) * o.rayon }
}

/**
 * LES DRONES (voir `Arme.orbite`) : chacun choisit sa cible — le verrouillé s'il est à la laisse, sinon il garde la
 * sienne, sinon le plus proche de lui qu'aucun autre drone n'attaque (le plus proche tout court, s'ils sont tous
 * pris) —, vole vers elle et lui tourne autour, tire de là ; sans cible, il rejoint sa place sur l'orbite, en suivant
 * le vaisseau. *Chiffres de moi, à rejuger.*
 */
function menerLesTourelles(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  // les vieilles s'éteignent
  m.tourelles = m.tourelles.filter((tu) => {
    const po = c.armes[tu.arme]?.pose
    if (po !== undefined && m.t - tu.nee < po.duree) return true
    ev.push({ type: 'tourelleFinie', x: tu.x, y: tu.y })
    return false
  })
  c.armes.forEach((a, i) => {
    const po = a.pose
    if (po === undefined) return
    // LE LANCER (Keko, 15/11 : « à la place de poser la tourelle sur lui, il la lance à très courte portée — un petit
    // objet qui se déploie en tourelle ; ça éviterait que, s'il est immobile, rien ne se passe ; il cible une zone qui
    // n'a pas déjà une tourelle ») : à l'heure, en vol, il cherche autour de lui, à `jet`, une PLACE LIBRE — à `ecart`
    // au moins de toute tourelle, en vol comprise — : la plus proche de l'insecte le plus proche, s'il y en a un pas
    // trop loin ; sinon celle qui est devant lui. Aucune place : il ne lance rien.
    if (m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const libres: Vecteur[] = []
    for (let k = 0; k < 12; k++) {
      const an = v.cap + (k * Math.PI) / 6
      const pl = { x: v.x + Math.cos(an) * po.jet, y: v.y + Math.sin(an) * po.jet }
      if (m.tourelles.every((tu) => Math.hypot(tu.x - pl.x, tu.y - pl.y) >= po.ecart)) libres.push(pl)
    }
    if (libres.length > 0) {
      let proche: Ennemi | undefined
      let dp = 150
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (d < dp) (dp = d), (proche = e)
      }
      const ou = proche === undefined ? libres[0] : libres.reduce((b, pl) => (Math.hypot(pl.x - proche!.corps.x, pl.y - proche!.corps.y) < Math.hypot(b.x - proche!.corps.x, b.y - proche!.corps.y) ? pl : b))
      m.armesA[i] = m.t + po.tous
      // (la capsule part du lance-tourelles, sur le dos, s'il y en a un : `bouche`)
      const b = boucheDansLeMonde(v, a)
      m.tourelles.push({ id: m.prochainId++, x: ou.x, y: ou.y, nee: m.t + po.vol, cap: v.cap, tirA: m.t + po.vol + 0.4, arme: i, x0: b.x, y0: b.y, lancee: m.t, deployee: false })
      ev.push({ type: 'tourelleLancee', x: b.x, y: b.y })
      const miennes = m.tourelles.filter((tu) => tu.arme === i)
      if (miennes.length > po.max) {
        const vieille = miennes[0]
        m.tourelles = m.tourelles.filter((tu) => tu !== vieille)
        ev.push({ type: 'tourelleFinie', x: vieille.x, y: vieille.y })
      }
    }
  })
  // LE DÉPLOIEMENT : une tourelle qui a fini son vol se pose
  for (const tu of m.tourelles)
    if (!tu.deployee && m.t >= tu.nee) {
      tu.deployee = true
      ev.push({ type: 'tourellePosee', x: tu.x, y: tu.y })
    }
  // LE TIR : chacune pivote vers sa cible et tire, alignée
  for (const tu of m.tourelles) {
    const a = c.armes[tu.arme]
    if (a === undefined || a.pose === undefined || !tu.deployee) continue
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - tu.x, e.corps.y - tu.y) <= a.portee
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - tu.x, e.corps.y - tu.y)
        if (d <= a.portee && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) continue
    const dist = Math.hypot(cible.corps.x - tu.x, cible.corps.y - tu.y)
    const temps = dist / a.vitesse
    const voulu = Math.atan2(cible.corps.y + cible.corps.vy * temps - tu.y, cible.corps.x + cible.corps.vx * temps - tu.x)
    const ecart = ecartDAngle(tu.cap, voulu)
    tu.cap += Math.sign(ecart) * Math.min(Math.abs(ecart), a.pose.pivot * dt)
    if (m.t < tu.tirA || Math.abs(ecartDAngle(tu.cap, voulu)) > 0.25) continue
    tu.tirA = m.t + a.cadence
    const angle = tu.cap + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * a.dispersion
    const x0 = tu.x + Math.cos(tu.cap) * 4
    const y0 = tu.y + Math.sin(tu.cap) * 4
    const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, m.prochainId, 12) < chanceDeCritique(c, a)
    m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: false, arme: a.id, critique })
    ev.push({ type: 'obus', x: x0, y: y0, arme: a.id })
  }
}

function menerLesDrones(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const armes = c.armes.map((a, i) => ({ a, i })).filter((x) => x.a.orbite !== undefined)
  if (armes.length === 0) {
    m.drones = []
    return
  }
  if (m.drones.length !== armes.length)
    m.drones = armes.map(({ a }) => {
      const h = placeDuDrone(m, a)
      return { x: h.x, y: h.y, vx: m.vaisseau.vx, vy: m.vaisseau.vy, cible: null }
    })
  const v = m.vaisseau
  armes.forEach(({ a, i }, k) => {
    const d = m.drones[k]
    const o = a.orbite!
    const laisse = o.laisse ?? 120
    // (un ailier ne choisit qu'à sa portée de tir, mesurée de lui — voir `orbite.ailier`)
    const aLaLaisse = (e: Ennemi): boolean => (o.ailier === true ? Math.hypot(e.corps.x - d.x, e.corps.y - d.y) <= a.portee : Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= laisse)
    let cible: Ennemi | undefined = d.cible === null ? undefined : m.ennemis.find((e) => e.id === d.cible && aLaLaisse(e))
    const ve = ennemiVerrouille(m)
    if (ve !== null && aLaLaisse(ve)) cible = ve
    if (cible === undefined) {
      const prises = new Set(m.drones.filter((x, j) => j !== k && x.cible !== null).map((x) => x.cible))
      let libre: Ennemi | undefined
      let proche: Ennemi | undefined
      let dl = Infinity
      let dp = Infinity
      for (const e of m.ennemis) {
        if (!aLaLaisse(e)) continue
        const dist = Math.hypot(e.corps.x - d.x, e.corps.y - d.y)
        if (dist < dp) (dp = dist), (proche = e)
        if (!prises.has(e.id) && dist < dl) (dl = dist), (libre = e)
      }
      cible = libre ?? proche
    }
    d.cible = cible === undefined ? null : cible.id
    // où il vole : autour de sa cible, ou à sa place (qu'il rejoint en suivant le vaisseau)
    let px: number
    let py: number
    if (cible !== undefined && o.ailier !== true) {
      const an = m.t * (o.tour ?? 3) + (k * 2 * Math.PI) / armes.length
      px = cible.corps.x + Math.cos(an) * (o.autour ?? 13)
      py = cible.corps.y + Math.sin(an) * (o.autour ?? 13)
    } else {
      const h = placeDuDrone(m, a)
      px = h.x
      py = h.y
    }
    const dx = px - d.x
    const dy = py - d.y
    const l = Math.hypot(dx, dy) || 1
    const vit = Math.min(o.vol ?? 170, l * 6)
    const suit = cible === undefined || o.ailier === true
    const wx = (dx / l) * vit + (suit ? v.vx : 0)
    const wy = (dy / l) * vit + (suit ? v.vy : 0)
    const kb = Math.min(1, dt * (o.braquage ?? 7))
    d.vx += (wx - d.vx) * kb
    d.vy += (wy - d.vy) * kb
    d.x += d.vx * dt
    d.y += d.vy * dt
    // (SON NEZ — Keko, 23/11 : « que l'escorte fasse face aux ennemis sur lesquels elle tire » : vers sa cible ; sans
    // cible, rendu à sa place, celui du vaisseau ; en route, sa course ; il y tourne à 12 rad/s au plus)
    {
      const vd = Math.hypot(d.vx - v.vx, d.vy - v.vy)
      const voulu = cible !== undefined ? Math.atan2(cible.corps.y - d.y, cible.corps.x - d.x) : l < 8 || vd < 20 ? v.cap : Math.atan2(d.vy, d.vx)
      const cap = d.cap ?? voulu
      const ec = ecartDAngle(cap, voulu)
      d.cap = cap + Math.sign(ec) * Math.min(Math.abs(ec), 12 * dt)
    }
    // il tire, sa cible à portée
    if (cible === undefined || m.t < (m.armesA[i] ?? 0)) return
    const dist = Math.hypot(cible.corps.x - d.x, cible.corps.y - d.y)
    if (dist > a.portee) return
    m.armesA[i] = m.t + a.cadence
    // (UN DRONE ÉLECTRIQUE frappe d'un arc, à l'instant)
    if (a.eclair === true) {
      const critique = critiqueTire(c, m, a, cible)
      if (a.electrocution !== undefined) electrocuter(c, m, cible, a.electrocution, ev, true)
      cible.pv -= a.degats * (critique ? facteurSur(c, m, a, cible) : 1)
      ev.push({ type: 'arc', x0: d.x, y0: d.y, x1: cible.corps.x, y1: cible.corps.y, drone: k, id: cible.id })
      ev.push({ type: 'ennemiTouche', id: cible.id, x: cible.corps.x, y: cible.corps.y, critique })
      if (cible.pv <= 0) abattreLEnnemi(c, m, cible, ev)
      return
    }
    const temps = dist / a.vitesse
    const vise = Math.atan2(cible.corps.y + cible.corps.vy * temps - d.y, cible.corps.x + cible.corps.vx * temps - d.x)
    const angle = vise + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * a.dispersion
    const critique = chanceDeCritique(c, a) > 0 && tire(m.graine, m.prochainId, 12) < chanceDeCritique(c, a)
    m.obus.push({ id: m.prochainId++, x: d.x, y: d.y, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? facteurDeCritique(c, a) : 1), guide: a.guide, arme: a.id, critique, ...effetsDuTir(a) })
    ev.push({ type: 'obus', x: d.x, y: d.y, arme: a.id })
  })
}

/** Verrouille l'ennemi `id` — ou le déverrouille, s'il l'était déjà. Un id qui n'est pas un ennemi ne change rien. */
export function verrouiller(m: Monde, id: number): void {
  if (m.verrou === id) m.verrou = null
  else if (m.ennemis.some((e) => e.id === id)) m.verrou = id
}

/** L'ennemi verrouillé, s'il est encore là. */
export function ennemiVerrouille(m: Monde): Ennemi | null {
  return m.verrou === null ? null : (m.ennemis.find((e) => e.id === m.verrou) ?? null)
}

/**
 * Où est l'ennemi le plus proche du joueur, à `portee` au plus — ou null. (Le jeu du vortex y tourne son nez tout seul.)
 * L'ENNEMI VERROUILLÉ PASSE DEVANT, s'il est à `portee` ; plus loin, c'est le plus proche.
 */
export function ennemiLePlusProche(m: Monde, portee: number): Vecteur | null {
  const v = m.vaisseau
  const ve = ennemiVerrouille(m)
  if (ve !== null && Math.hypot(ve.corps.x - v.x, ve.corps.y - v.y) <= portee) return { x: ve.corps.x, y: ve.corps.y }
  let cible: Vecteur | null = null
  let dc = portee
  for (const e of m.ennemis) {
    const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    if (d <= dc) (dc = d), (cible = { x: e.corps.x, y: e.corps.y })
  }
  return cible
}

/** Ce qu'il faut d'expérience pour passer du niveau `n` au suivant. */
/**
 * LA PÉPITE RAMASSÉE AU VORTEX : sa valeur en expérience (1, 3 ou 10 — voir `invasion.gemmes`) ; la barre pleine, un
 * niveau, autant de fois qu'il le faut. L'AIMANT (voir `invasion.aimant`) : toutes les pépites du monde sont aimantées.
 */
function gagnerLaPepite(c: ConfigVaisseau, m: Monde, p: Pepite, ev: Evenement[]): void {
  // (UNE PLAQUE : la dernière cassée revient — voir `recuperation`)
  if (p.plaque === true) {
    const k = m.plaques.lastIndexOf(false)
    if (k >= 0) {
      m.plaques[k] = true
      ev.push({ type: 'plaqueReparee', k })
    }
    return
  }
  // (UN SOIN : une part du blindage revient, sans dépasser le plein — voir `invasion.soin`)
  if (p.soin === true) {
    m.coque = Math.min(c.coque, m.coque + c.coque * c.invasion.soin.part)
    ev.push({ type: 'soin', x: p.x, y: p.y })
    return
  }
  if (p.aimant === true) {
    for (const q of m.pepites) {
      // (l'aimant n'attire ni les plaques ni les soins : ils vont à qui en manque)
      if (q.aimant === true || q.plaque === true || q.soin === true) continue
      q.aimanteeA = m.t
      if (m.equipage !== undefined) q.par = m.equipage.actif
    }
    ev.push({ type: 'aimant', x: p.x, y: p.y })
    return
  }
  m.invasion.xp += (p.valeur ?? 1) * (c.invasion.gainXp ?? 1)
  while (m.invasion.xp >= xpDuNiveau(c, m.invasion.niveau)) {
    m.invasion.xp -= xpDuNiveau(c, m.invasion.niveau)
    m.invasion.niveau += 1
    ev.push({ type: 'niveau', niveau: m.invasion.niveau })
  }
}
export const xpDuNiveau = (c: ConfigVaisseau, n: number): number => c.invasion.xpBase + (Math.max(1, n) - 1) * c.invasion.xpPas

/**
 * L'INVASION CONTINUE SANS LE JOUEUR ABATTU : les vagues naissent, les insectes marchent et traversent le portail ; sa
 * pénalité passée, il REVIENT au portail, blindage et bouclier pleins.
 */
function avancerSansLeJoueur(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[], direction: Vecteur = { x: 0, y: 0 }, seul = false): void {
  // (`seul` : le tour d'un pilote de l'équipage — le monde commun a déjà avancé, voir `avancerLEquipage`)
  // LA PARTIE EST FINIE (voir `invasion.vies`) : seul, abattu sans vie ; à plusieurs, au tour du premier — c'est que
  // personne ne vole plus (voir `avancerLEquipage`)
  if (!seul && c.invasion.vies > 0 && (aPlusieurs(m) || m.invasion.vies <= 0)) {
    m.invasion.finie = true
    ev.push({ type: 'fin', vague: m.invasion.vague })
    return
  }
  if (!seul) {
    m.t += dt
    menerLInvasion(c, m, ev)
    menerLesDerives(c, m)
    menerLesRochesPrises(c, m, dt)
    for (const e of [...m.ennemis]) conduireLEnnemi(c, m, e, dt, ev)
    m.ennemis = m.ennemis.filter((e) => !e.parti)
    ecarterLesInsectes(c, m)
    heurterLesDerives(c, m)
    if (c.invasion.sansPortail) heurterLesRoches(c, m, ev)
  }
  // (SANS PORTAIL, L'ÉPAVE GLISSE VERS SON POINT DE RETOUR — voir `invasion.retour` : les insectes y convergent, les roches
  // s'y comptent, la caméra y va)
  const I = c.invasion
  if (I.sansPortail) {
    // (… ET LE MANCHE LA DÉPLACE — Keko, 21/11 : « pendant le décompte de la résurrection, que le joueur puisse déplacer la
    // zone comme il déplace son vaisseau, plus lentement ; pour essayer d'exploser un maximum d'insectes » : à
    // `retour.vitesse` au plus ; elle reste dans l'arène, ramenée comme le point de retour)
    const n = Math.hypot(direction.x, direction.y)
    if (n > 0.01) {
      const k = (I.retour.vitesse * Math.min(1, n) * dt) / n
      m.vaisseau = { ...m.vaisseau, x: m.vaisseau.x + direction.x * k, y: m.vaisseau.y + direction.y * k }
    }
    const o = pointDeRetour(c, m)
    const b = m.vaisseau
    const d = Math.hypot(o.x - b.x, o.y - b.y)
    const pas = Math.min(d, 400 * dt)
    m.vaisseau = { ...b, x: d > 0 ? b.x + ((o.x - b.x) / d) * pas : b.x, y: d > 0 ? b.y + ((o.y - b.y) / d) * pas : b.y, vx: 0, vy: 0 }
  }
  // (À PLUSIEURS, LE COMPTE NE COURT QUE SOUS UN ALLIÉ, et jamais sans vie : il est retenu — voir `invasion.vies`)
  if (I.vies > 0 && aPlusieurs(m) && (m.invasion.vies <= 0 || alliesAuRetour(c, m) === 0)) m.invasion.retourA += dt
  if (m.t < m.invasion.retourA) return
  if (I.vies > 0) m.invasion.vies = Math.max(0, m.invasion.vies - 1)
  if (I.sansPortail) {
    // IL REVIENT LÀ OÙ IL EST TOMBÉ, dans une explosion de lumière qui abat ce qui l'entoure
    const o = pointDeRetour(c, m)
    m.vaisseau = { ...nouveauVaisseau(), x: o.x, y: o.y }
    for (const e of [...m.ennemis]) {
      if (e.grand === true || Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > I.retour.rayon + rayonDe(c, e)) continue
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
      e.horsArmeA = m.t
      e.pv = 0
      abattreLEnnemi(c, m, e, ev)
    }
    ev.push({ type: 'deflagration', x: o.x, y: o.y, rayon: I.retour.rayon })
  } else m.vaisseau = nouveauVaisseau()
  m.coque = c.coque
  m.bouclier = c.bouclier.points
  m.plaques = Array.from({ length: c.plaques }, () => true)
  m.intouchableJusque = m.t + c.invulnerabilite // (il revient en clignotant : rien ne le touche le temps d'un souffle)
  m.corruption = 0
  m.dephaseJusque = -100
  m.toucheA = -100
  // (… ET IL EST INVINCIBLE ET PASSE AU TRAVERS DE TOUT, le temps de se replacer — voir `invasion.retour`)
  if (I.sansPortail) {
    m.renaitJusque = m.t + I.retour.invincible
    m.intouchableJusque = Math.max(m.intouchableJusque, m.renaitJusque)
  }
  m.phase = 'vol'
  ev.push({ type: 'retour' })
}

/**
 * LA POSTCOMBUSTION (une mécanique du labo) : sa part en cours — 1 tant qu'elle pousse, puis de 1 à 0 pendant la
 * retombée, 0 hors d'elle.
 */
export function partDeLaPostcombustion(c: ConfigVaisseau, m: Monde): number {
  if (!c.postcombustion.active) return 0
  const age = m.t - m.boostA
  if (age < 0 || age >= c.postcombustion.duree + c.postcombustion.retombee) return 0
  return age < c.postcombustion.duree ? 1 : 1 - (age - c.postcombustion.duree) / c.postcombustion.retombee
}
/** Sa recharge, de 0 (elle vient de partir) à 1 (prête). */
export const rechargeDeLaPostcombustion = (c: ConfigVaisseau, m: Monde): number => Math.max(0, Math.min(1, (m.t - m.boostA) / c.postcombustion.recharge))
/** La lancer : vrai si elle part (débloquée, en vol, rechargée). */
export function postcombustion(c: ConfigVaisseau, m: Monde): boolean {
  if (!c.postcombustion.active || m.phase !== 'vol' || m.t - m.boostA < c.postcombustion.recharge) return false
  m.boostA = m.t
  return true
}

/** La part de sa portée qu'une bombe parcourt, selon la force du geste (0 à 1) : sans geste franc, celle d'une tape. */
export function porteeDeLaBombe(c: ConfigVaisseau, direction?: Vecteur): number {
  const n = direction === undefined ? 0 : Math.min(1, Math.hypot(direction.x, direction.y))
  return c.bombe.vitesse * c.bombe.vie * (n > 0.05 ? c.bombe.pres + (1 - c.bombe.pres) * n : c.bombe.tape)
}
/**
 * LANCE UNE BOMBE, s'il reste une charge : vers `direction` si elle est donnée et franche — d'autant plus loin qu'elle
 * est longue —, sinon droit devant le nez, à la portée d'une tape. Elle ne garde rien de l'élan du vaisseau : elle
 * éclate là où la visée l'a montré. Rend vrai si elle est partie.
 */
export function lancerLaBombe(c: ConfigVaisseau, m: Monde, direction?: Vecteur): boolean {
  if (m.phase !== 'vol' || m.charges <= 0) return false
  const v = m.vaisseau
  const n = direction === undefined ? 0 : Math.hypot(direction.x, direction.y)
  const ux = n > 0.05 ? direction!.x / n : Math.cos(v.cap)
  const uy = n > 0.05 ? direction!.y / n : Math.sin(v.cap)
  m.charges -= 1
  m.bombes.push({ id: m.prochainId++, x: v.x, y: v.y, vx: ux * c.bombe.vitesse, vy: uy * c.bombe.vitesse, vie: porteeDeLaBombe(c, direction) / c.bombe.vitesse })
  return true
}

/**
 * `regard` : où le nez se tourne (voir `voler`). `manuel` : LE TIR EST À LA MAIN (Keko, 12/11 : « quand le joueur utilise
 * le stick d'orientation, le tir des armes passe en manuel — sauf les missiles, à tête chercheuse — et tire dans la
 * direction de la visée ») : tant que le regard est franc, les armes tirent à leur cadence DANS SA DIRECTION, rival ou
 * pas — les missiles aussi, qui virent ensuite vers le rival s'il y en a un.
 */
// (`seul` : LE TOUR D'UN PILOTE DE L'ÉQUIPAGE, le monde commun déjà avancé — ni le temps, ni les insectes, ni les roches ne
// bougent : son vaisseau, ses armes, ses coups, ses pépites — voir `avancerLEquipage`)
export function avancerLeMonde(c: ConfigVaisseau, m: Monde, dt: number, direction: Vecteur, regard?: Vecteur, manuel = false, seul = false): { chocs: Choc[]; evenements: Evenement[] } {
  const ev: Evenement[] = []
  m.coqueMax = c.coque
  // (le lance-flammes ne crache qu'en vol, à ce pas : abattu, il se tait — Keko, 15/11 : « quand je meurs, le souffle
  // du lance-flammes reste en place pendant le compte du retour »)
  m.crache = false
  // (… NI SES PROJECTILES, NI CE QU'IL A POSÉ — Keko, 21/11 : « quand je suis mort, les balles de mitraillette sont restées
  // sur place, sans bouger, durant tout le temps de la résurrection » : rien ne les menait plus ; obus, bombes, traits,
  // flaques, givres, balises et tourelles partent avec lui)
  if (m.phase !== 'vol') (m.obus = []), (m.bombes = []), (m.tirs = []), (m.flaques = []), (m.givres = []), (m.balises = []), (m.tourelles = [])
  if (m.phase !== 'vol') (m.drones = []), (m.balayage = null), (m.canal = null), (m.scies = []), (m.tornades = []), (m.novas = []), (m.echardes = []), (m.spheres = []), (m.puits = []), (m.meteores = []), (m.tentacules = []), (m.nuees = []), (m.rejetons = []), (m.flaquesAcides = []), (m.mines = []), (m.fleaux = []), (m.parasites = []), (m.vrilles = []), (m.liens = []), (m.oeufs = []), (m.brochettes = []), (m.miniVers = []), (m.hypercubes = []), (m.des = []), (m.coupes = [])
  // (le portail tombé, la partie est finie : plus rien n'avance)
  if (m.invasion.finie) return { chocs: [], evenements: ev }
  if (m.verrou !== null && ennemiVerrouille(m) === null) m.verrou = null
  if (m.phase !== 'vol') {
    if (c.invasion.active && m.phase === 'perdu') avancerSansLeJoueur(c, m, dt, ev, direction, seul)
    return { chocs: [], evenements: ev }
  }
  if (!seul) m.t += dt
  // le bouclier se recharge, passé le délai sans coup
  if (c.bouclier.points > 0 && m.bouclier < c.bouclier.points && m.t - m.toucheA >= c.bouclier.delai) m.bouclier = Math.min(c.bouclier.points, m.bouclier + ((c.bouclier.plein ?? 0) > 0 ? c.bouclier.points / c.bouclier.plein! : c.bouclier.regain) * dt)
  // (LES PLAQUES SE RÉPARENT — voir `reparation` : la dernière cassée revient, une à la fois)
  if (c.reparation > 0 && m.phase === 'vol' && m.t - m.plaqueCasseeA >= c.reparation) {
    const k = m.plaques.lastIndexOf(false)
    if (k >= 0) {
      m.plaques[k] = true
      m.plaqueCasseeA = m.t
      ev.push({ type: 'plaqueReparee', k })
    }
  }
  // la coque se régénère, sans attendre (l'Essaim)
  if (c.regeneration > 0 && m.coque > 0 && m.coque < c.coque) m.coque = Math.min(c.coque, m.coque + c.regeneration * c.coque * dt)
  // la corruption ronge la coque (les Innommés) ; toute rongée, la partie est perdue
  if (c.corruption.ronge > 0 && m.corruption > 0) {
    const d = Math.min(m.corruption, c.corruption.ronge * dt)
    m.corruption -= d
    m.coque -= d
    if (m.coque <= 1e-9) {
      m.coque = 0
      m.corruption = 0
      m.phase = 'perdu'
      if (c.invasion.active) m.invasion.retourA = m.t + c.invasion.penalite
      ev.push({ type: 'perdu' })
      return { chocs: [], evenements: ev }
    }
  }
  // LA POSTCOMBUSTION : la poussée et la pointe multipliées le temps qu'elle dure, la pointe qui retombe ensuite ; sans
  // manche, elle pousse droit devant
  const boost = partDeLaPostcombustion(c, m)
  const pousse = boost > 0 && m.t - m.boostA < c.postcombustion.duree
  const moteur = boost > 0 ? { poussee: c.poussee * (pousse ? c.postcombustion.poussee : 1), vitesseMax: c.vitesseMax * (1 + (c.postcombustion.vitesse - 1) * boost), rotation: c.rotation, rayon: c.rayon, masse: c.masse, virage: c.virage } : c
  const dir = pousse && Math.hypot(direction.x, direction.y) < 0.2 ? { x: Math.cos(m.vaisseau.cap), y: Math.sin(m.vaisseau.cap) } : direction
  // (un vaisseau à tourelles ne tourne pas vers son regard : il ne sert plus bas qu'à viser)
  // (REVENU, il traverse les roches — voir `invasion.retour` ; déphasé, plus — voir `dephasage`)
  const r = voler(c, m.t < m.renaitJusque ? { ...moteur, fantome: true } : moteur, m.vaisseau, dt, dir, m.detruits, c.tourelles ? undefined : regard)
  const avantLeVol = m.vaisseau
  m.vaisseau = r.vaisseau
  // (L'ARÈNE : la tempête, ses roches, son bord — voir `arene`)
  const chocsDeLArene = subirLArene(c, m, dt, ev, avantLeVol)
  if (m.phase !== 'vol') return { chocs: chocsDeLArene, evenements: ev }
  const v = m.vaisseau
  const chocs = [...r.chocs, ...chocsDeLArene]
  // les chocs du joueur : la coque en souffre selon la vitesse, la roche aussi — SAUF SOUS BOUCLIER (Keko : sinon les
  // joueurs s'en servent de bélier) : le bouclier prend le coup, la roche n'a rien
  for (const choc of r.chocs) {
    // (la roche traversée éclate, bouclier ou pas ; la coque ne prend que la part du coup que pèse la roche)
    const degats = coutDuChoc(c, choc, c.collision.degatsCoque) * (choc.perce ?? 1)
    if (choc.perce !== undefined) {
      const a = asteroidesVisibles(c, m, choc.x, choc.y, c.champ.rayonMax + 2).find((x) => x.id === choc.asteroide)
      if (a !== undefined) eclaterLaRoche(c, m, a, ev)
    } else if (!sousBouclier(c, m)) abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
    if (degats <= 0) continue
    encaisser(c, m, choc.x, choc.y, degats, ev)
    if (m.phase !== 'vol') return { chocs, evenements: ev }
  }

  // l'ennemi : il naît à l'heure dite, un à la fois ; ses chocs comptent aussi, et peuvent l'abattre
  // (jamais tant que le joueur est dans la zone calme de la base)
  // (L'ACIDE : ce que les insectes rongés perdent pendant ce pas — de toutes les sources — sera majoré, voir `majorerParLAcide`)
  const avantLAcide = new Map<Ennemi, number>()
  for (const e of m.ennemis) if (e.acide !== undefined && e.acide.jusque > m.t) avantLAcide.set(e, e.pv)
  if (!seul) {
    if (c.invasion.active) menerLInvasion(c, m, ev)
    else if (m.ennemis.length === 0 && m.t >= m.prochainEnnemiA && Math.hypot(v.x, v.y) >= c.base.calme) faireNaitreUnEnnemi(c, m, ev)
    menerLesDerives(c, m)
    menerLesRochesPrises(c, m, dt)
    for (const e of [...m.ennemis]) {
      chocs.push(...conduireLEnnemi(c, m, e, dt, ev))
      // (il brûle encore : le lance-flammes l'a touché — mais à sa sortie seulement : dans la flamme, c'est elle qui brûle)
      if ((e.bruleA ?? -1) > m.t && (e.bruleA ?? 0) - m.t < (e.dureeBrulure ?? 0) - dt * 1.5) e.pv -= (e.dpsBrulure ?? 0) * dt
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    // (les insectes passés par le portail ont quitté le monde)
    if (c.invasion.active) m.ennemis = m.ennemis.filter((e) => !e.parti)
    if (c.invasion.active) ecarterLesInsectes(c, m)
    heurterLesDerives(c, m)
    if (c.invasion.sansPortail) heurterLesRoches(c, m, ev)
  }
  // (L'INVINCIBILITÉ DU RETOUR FINIE : ce qui le recouvre est écarté — voir `degager`)
  if (m.renaitJusque > -100 && m.t >= m.renaitJusque) {
    degager(c, m)
    m.renaitJusque = -100
  }
  if (!heurterLesVaisseaux(c, m, ev)) return { chocs, evenements: ev }

  // le laser du joueur : la roche la plus proche à portée, au débit et à la portée de SA foreuse (le hangar) — LES ROCHES
  // SEULES : il a creusé le rival un temps, Keko l'a réservé aux astéroïdes, ce sont les armes qui l'attaquent
  if (c.foreuses.length > 0) {
    // (CHAQUE FOREUSE, depuis SA place sur le vaisseau, sur la roche la plus proche D'ELLE, à sa portée et à son débit ;
    // une roche éclatée par la première n'est plus là pour la suivante)
    const ca = Math.cos(v.cap)
    const sa = Math.sin(v.cap)
    m.forages = c.foreuses.map((f) => {
      const ou = { x: v.x + (f.place === undefined ? 0 : f.place.x * ca - f.place.y * sa), y: v.y + (f.place === undefined ? 0 : f.place.x * sa + f.place.y * ca) }
      const roche = rocheLaPlusProche(c, m, ou.x, ou.y, c.forage.portee * f.portee)
      return roche !== null ? creuserLaRoche(c, m, roche.roche, ou, c.forage.debit * f.debit * dt, ev, c.passifs.pepiteDouble) : null
    })
    m.forage = m.forages.find((f) => f !== null) ?? null
  } else {
    const portee = c.forage.portee * c.foreuse.portee
    const debit = c.forage.debit * c.foreuse.debit
    const roche = rocheLaPlusProche(c, m, v.x, v.y, portee)
    m.forage = roche !== null ? creuserLaRoche(c, m, roche.roche, v, debit * dt, ev, c.passifs.pepiteDouble) : null
    m.forages = [m.forage]
  }

  // LES ARMES : chacune tire seule, à sa cadence, sur le rival le plus proche à sa portée, avec de l'avance et sa dispersion
  // (LES INSECTES D'ABORD : les roches qui dérivent leur sont masquées tant qu'un insecte est à portée — voir `rochesMasquees`)
  const masquees = rochesMasquees(c, m)
  if (masquees.length > 0) m.ennemis = m.ennemis.filter((e) => !masquees.includes(e))
  m.crache = false
  menerLesDrones(c, m, dt, ev)
  menerLesTourelles(c, m, dt, ev)
  brulerLesFlaques(c, m, dt, ev)
  menerLeRayon(c, m, ev)
  canaliserLeRayon(c, m, dt, ev)
  harponner(c, m, dt, ev)
  concentrerLesFaisceaux(c, m, dt, ev)
  menerLesBalisesLaser(c, m, dt, ev)
  menerLesSillons(c, m, dt, ev)
  mener_L_Electricite(c, m, dt, ev)
  menerLesScies(c, m, dt, ev)
  menerLesBalises(c, m, dt, ev)
  menerLeGivre(c, m, dt, ev)
  lancerLesNovas(c, m, ev)
  tirerLesSalves(c, m, ev)
  condenserLesEchardes(c, m, ev)
  tirerLesEssaims(c, m, ev)
  menerLesSpheres(c, m, dt, ev)
  menerLesPuits(c, m, dt, ev)
  menerLesMeteores(c, m, ev)
  tirerLesRails(c, m, ev)
  menerLesTentacules(c, m, ev)
  menerLesNuees(c, m, dt, ev)
  menerLesRejetons(c, m, dt, ev)
  cracherLAcide(c, m, dt, ev)
  menerLesMines(c, m, ev)
  menerLesFleaux(c, m, dt, ev)
  menerLesParasites(c, m, dt, ev)
  menerLeDrain(c, m, dt, ev)
  menerLesVrilles(c, m, dt, ev)
  menerLesOeufs(c, m, dt, ev)
  menerLesEpines(c, m, dt, ev)
  menerLesHypercubes(c, m, ev)
  menerLesDes(c, m, ev)
  menerLesCoupes(c, m, ev)
  menerLesTornades(c, m, dt, ev)
  c.armes.forEach((arme, i) => {
    if (arme.flamme !== undefined) return cracherLaFlamme(c, m, arme, arme.flamme, dt, ev)
    if (arme.orbite !== undefined || arme.pose !== undefined || arme.balayage !== undefined || arme.canalise !== undefined || arme.harpon !== undefined || arme.lien !== undefined || arme.chaine !== undefined || arme.aura !== undefined || arme.scie !== undefined || arme.balise !== undefined || arme.givre !== undefined || arme.nova !== undefined || arme.salve !== undefined || arme.condense !== undefined || arme.tornade !== undefined || arme.essaim !== undefined || arme.sphere !== undefined || arme.puits !== undefined || arme.meteore !== undefined || arme.rail !== undefined || arme.tentacule !== undefined || arme.nuee !== undefined || arme.rejeton !== undefined || arme.crachat !== undefined || arme.mine !== undefined || arme.fleau !== undefined || arme.parasite !== undefined || arme.drain !== undefined || arme.vrille !== undefined || arme.ponte !== undefined || arme.epines !== undefined || arme.hypercube !== undefined || arme.de !== undefined || arme.coupe !== undefined) return
    if (m.t < (m.armesA[i] ?? 0)) return
    // (les missiles aussi — Keko : « de toute façon ils suivent pareil, et s'il n'y a rien à suivre ils vont tout droit »)
    const aLaMain = manuel && regard !== undefined && Math.hypot(regard.x, regard.y) > 0.05
    // (LA BOUCHE DE L'ARME, sur le vaisseau : c'est D'ELLE qu'on vise, pas du centre — Keko, 14/11 : « les projectiles
    // manquent parfois les ennemis alors que je suis de face ; le canon est sur l'aile, donc sur le côté » : visé du
    // centre et tiré de l'aile, l'obus partait PARALLÈLE à la bonne ligne, décalé de l'écart de l'aile — de près, il
    // passait à côté d'une petite cible)
    const bo0 = arme.bouche
    const bx = bo0 === undefined ? v.x : v.x + Math.cos(v.cap) * bo0.x - Math.sin(v.cap) * bo0.y
    const by = bo0 === undefined ? v.y : v.y + Math.sin(v.cap) * bo0.x + Math.cos(v.cap) * bo0.y
    let vise: number
    // (une boule de napalm vole juste le temps d'atteindre la cible — là où elle sera)
    let vieDuTir = arme.vie
    // (… et un obus en cloche file au sol juste assez vite pour y retomber au bout de son vol — voir `Arme.cloche`)
    let vitesseDuTir = arme.vitesse
    // (la cible visée : un tir infaillible s'y accroche)
    let cibleDuTir: Ennemi | null = null
    if (aLaMain) vise = Math.atan2(regard!.y, regard!.x)
    else {
      let cible: Ennemi | null = null
      let dc = Infinity
      // (hors de portée, ou hors de l'arc de tir, devant le nez : pas une cible)
      const enVue = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= arme.portee && !(c.arcDeTir > 0 && arme.tousSens !== true && Math.abs(ecartDAngle(v.cap, Math.atan2(e.corps.y - v.y, e.corps.x - v.x))) > c.arcDeTir)
      // (L'ENNEMI VERROUILLÉ D'ABORD, s'il est en vue ; sinon le plus proche)
      const ve = ennemiVerrouille(m)
      if (ve !== null && enVue(ve)) cible = ve
      else for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (enVue(e) && d < dc) (dc = d), (cible = e)
      }
      // (LE NAPALM TIRE MÊME SANS CIBLE — Keko, 18/11 : « le napalm devrait tirer même en l'absence d'ennemis, un peu au
      // hasard autour de lui : il laisse une flaque, ça peut avoir un intérêt de tirer sans cible ; pas le lance-flammes ni
      // le rayon thermique » : personne en vue, il vise un point tiré au hasard, entre 45 et 95 % de sa portée)
      if (cible === null && arme.napalm !== undefined) {
        const an = tire(m.graine, m.prochainId, 13) * Math.PI * 2
        const loin = arme.portee * (0.45 + 0.5 * tire(m.graine, m.prochainId, 14))
        cible = { id: -1, corps: { ...v, x: bx + Math.cos(an) * loin, y: by + Math.sin(an) * loin, vx: 0, vy: 0 } } as Ennemi
      }
      if (cible === null) return
      if (cible.id >= 0) cibleDuTir = cible
      const temps = arme.minuterie !== undefined ? arme.minuterie.duree : (arme.cloche?.vol ?? 0) + Math.hypot(cible.corps.x - bx, cible.corps.y - by) / arme.vitesse
      vise = Math.atan2(cible.corps.y + cible.corps.vy * temps - by, cible.corps.x + cible.corps.vx * temps - bx)
      // (l'avance prise sur la cible ne fait pas sortir le tir de l'arc)
      if (c.arcDeTir > 0 && arme.tousSens !== true) vise = v.cap + Math.max(-c.arcDeTir, Math.min(c.arcDeTir, ecartDAngle(v.cap, vise)))
      // (sans bouche, le tir part du bord du vaisseau : d'autant moins à voler)
      // (une orbe de plasma aussi : elle éclate là où sera la cible ; et un obus tiré en cloche, il y retombe)
      // (une grenade à retardement : lancée juste assez vite pour s'arrêter, freinée, là où sera la cible — la distance
      // parcourue en `duree` à `frein` par seconde est v × (1 − e^(−frein × duree)) / frein)
      if (arme.minuterie !== undefined) {
        const k = arme.minuterie.frein
        vieDuTir = temps
        vitesseDuTir = (Math.max(0, Math.hypot(cible.corps.x + cible.corps.vx * temps - bx, cible.corps.y + cible.corps.vy * temps - by) - (arme.bouche === undefined ? c.rayon + 3 : 0)) * k) / (1 - Math.exp(-k * temps))
      } else if (arme.cloche !== undefined) {
        vieDuTir = temps
        vitesseDuTir = Math.max(0, Math.hypot(cible.corps.x + cible.corps.vx * temps - bx, cible.corps.y + cible.corps.vy * temps - by) - (arme.bouche === undefined ? c.rayon + 3 : 0)) / temps
      } else if (arme.napalm !== undefined || arme.plasma !== undefined) vieDuTir = Math.min(arme.vie, Math.max(0, Math.hypot(cible.corps.x + cible.corps.vx * temps - bx, cible.corps.y + cible.corps.vy * temps - by) - (arme.bouche === undefined ? c.rayon + 3 : 0)) / arme.vitesse)
    }
    // (EN RAFALE : le tir suivant de la rafale vient vite ; la rafale finie, la cadence de l'arme — voir `Arme.rafale`)
    // (ENTRE LES AILES, la rafale est partagée : l'autre aile tire juste après — voir `Arme.rafale`)
    const ra = arme.rafale
    const enAiles = c.alternance && arme.ajoutee !== true
    const coup = ra === undefined ? 0 : (enAiles ? m.rafaleDesAiles : (m.rafales[i] ?? 0)) + 1
    if (ra !== undefined && coup < ra.nombre) {
      if (enAiles) {
        m.rafaleDesAiles = coup
        m.armesA[i] = m.t + 2 * ra.intervalle
        c.armes.forEach((b, j) => {
          if (j !== i && b.ajoutee !== true) m.armesA[j] = m.t + ra.intervalle
        })
      } else {
        m.rafales[i] = coup
        m.armesA[i] = m.t + ra.intervalle
      }
    } else if (ra !== undefined && enAiles) {
      // (la rafale finie : toutes les ailes attendent la cadence)
      m.rafaleDesAiles = 0
      c.armes.forEach((b, j) => {
        if (j === i || b.ajoutee !== true) m.armesA[j] = m.t + arme.cadence
      })
    } else if (arme.jumele === true && c.alternance && arme.ajoutee !== true) {
      // (LES AILES JUMELÉES TIRENT ENSEMBLE — voir `Arme.jumele` : chacune au rythme où les ailes se relayaient ; la première
      // d'une salve entraîne les autres jumelées, tout de suite ; les autres ailes attendent leur tour, comme avant)
      const ailes = c.armes.filter((b) => b.ajoutee !== true).length
      m.armesA[i] = m.t + arme.cadence / ailes
      if (m.t - m.salveDesAiles >= arme.cadence / ailes / 2) {
        m.salveDesAiles = m.t
        c.armes.forEach((b, j) => {
          if (j !== i && b.ajoutee !== true && b.jumele === true) m.armesA[j] = m.t
        })
      }
      c.armes.forEach((b, j) => {
        if (j !== i && b.ajoutee !== true && b.jumele !== true) m.armesA[j] = Math.max(m.armesA[j] ?? 0, m.t + arme.cadence / ailes)
      })
    } else {
      if (ra !== undefined) m.rafales[i] = 0
      m.armesA[i] = m.t + arme.cadence
      // (À TOUR DE RÔLE ENTRE LES AILES SEULEMENT : une arme ajoutée par une carte spéciale tire à son pas — voir `Arme.ajoutee`)
      if (c.alternance && arme.ajoutee !== true) {
        const ailes = c.armes.filter((b) => b.ajoutee !== true).length
        c.armes.forEach((b, j) => {
          if (j !== i && b.ajoutee !== true) m.armesA[j] = Math.max(m.armesA[j] ?? 0, m.t + arme.cadence / ailes)
        })
      }
    }
    // (UN LASER CONCENTRÉ : pas d'obus, un rayon accroché à la cible — voir `Arme.concentre`)
    if (arme.concentre !== undefined) {
      if (cibleDuTir === null) return
      const critique = critiqueSur(c, m, arme, cibleDuTir, () => tire(m.graine, m.prochainId, 12))
      m.prochainId++
      m.faisceaux = m.faisceaux.filter((f) => f.arme !== i)
      m.faisceaux.push({ arme: i, cible: cibleDuTir.id, nee: m.t, dps: (arme.degats * (critique ? facteurSur(c, m, arme, cibleDuTir) : 1)) / arme.concentre.duree })
      // (UN RAYON CRITIQUE DÉTONE à son départ, de `part` fois tout ce qu'il ronge — voir `Arme.detonation`)
      if (critique && arme.detonation !== undefined) exploser(c, m, cibleDuTir.corps.x, cibleDuTir.corps.y, { rayon: arme.detonation.rayon, degats: arme.degats * facteurSur(c, m, arme, cibleDuTir) * arme.detonation.part }, cibleDuTir, ev, arme.id, true)
      ev.push({ type: 'obus', x: bx, y: by, arme: arme.id })
      return
    }
    // (EN GERBE : plusieurs obus à chaque tir, écartés — voir `Arme.gerbe`)
    const nGerbe = arme.gerbe?.nombre ?? 1
    for (let g = 0; g < nGerbe; g++) {
      const angle = vise + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * arme.dispersion + (nGerbe > 1 ? (g - (nGerbe - 1) / 2) * (arme.gerbe?.ecart ?? 0) : 0)
      const bo = arme.bouche
      const x0 = bo === undefined ? v.x + Math.cos(angle) * (c.rayon + 3) : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
      const y0 = bo === undefined ? v.y + Math.sin(angle) * (c.rayon + 3) : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
      // (le coup critique du labo : tiré du même hachage que la dispersion, sur une autre clé)
      const critique = chanceDeCritique(c, arme) > 0 && tire(m.graine, m.prochainId, 12) < chanceDeCritique(c, arme)
      m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * vitesseDuTir, vy: Math.sin(angle) * vitesseDuTir, vie: vieDuTir, degats: arme.degats * (critique ? facteurDeCritique(c, arme) : 1), guide: arme.guide, arme: arme.id, critique, ...(arme.infaillible === true && cibleDuTir !== null ? { verrou: cibleDuTir.id } : {}), ...effetsDuTir(arme), ...(arme.napalm === undefined ? {} : { napalm: arme.napalm, vie0: vieDuTir }), ...(arme.plasma === undefined ? {} : { zone: arme.plasma, perce: [], vie0: vieDuTir }), ...(arme.cloche !== undefined ? { cloche: true, vie0: vieDuTir } : {}), ...(arme.minuterie !== undefined ? { minuterie: arme.minuterie.frein, vie0: vieDuTir } : {}), brut: arme.degats })
      if (g === 0) ev.push({ type: 'obus', x: x0, y: y0, arme: arme.id })
    }
    // (DEUX TIRS DE CÔTÉ, PLUS PETITS — voir `Arme.cotes` : de la même bouche, à ± `angle` du tir, `part` de ses dégâts, une
    // balle `calibre` fois plus fine ; chacun son critique, sans verrou)
    const co = arme.cotes
    if (co !== undefined) {
      const bo = arme.bouche
      for (const s of [-1, 1]) {
        const angle = vise + s * co.angle
        const x0 = bo === undefined ? v.x + Math.cos(angle) * (c.rayon + 3) : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
        const y0 = bo === undefined ? v.y + Math.sin(angle) * (c.rayon + 3) : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
        const petite = { ...arme, degats: arme.degats * co.part }
        const critique = critiqueTire(c, m, arme)
        const effets = effetsDuTir(petite)
        m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * vitesseDuTir, vy: Math.sin(angle) * vitesseDuTir, vie: vieDuTir, degats: petite.degats * (critique ? facteurDeCritique(c, arme) : 1), guide: false, arme: arme.id, critique, ...effets, ...(effets.balle === undefined ? {} : { balle: { ...effets.balle, calibre: effets.balle.calibre * co.calibre } }), brut: petite.degats })
      }
    }
  })
  // les obus volent (les guidés tournent vers le rival le plus proche, à 3,5 rad/s), touchent le rival, s'écrasent sur une roche
  for (let i = m.obus.length - 1; i >= 0; i--) {
    const o = m.obus[i]
    o.vie -= dt
    traquer(m, o, dt)
    if (o.guide && m.ennemis.length > 0) {
      let cible = ennemiVerrouille(m) ?? m.ennemis[0]
      if (m.verrou === null || cible.id !== m.verrou) for (const e of m.ennemis) if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) < Math.hypot(cible.corps.x - o.x, cible.corps.y - o.y)) cible = e
      const vit = Math.hypot(o.vx, o.vy)
      const voulu = Math.atan2(cible.corps.y - o.y, cible.corps.x - o.x)
      const ecart = ecartDAngle(Math.atan2(o.vy, o.vx), voulu)
      const cap = Math.atan2(o.vy, o.vx) + Math.sign(ecart) * Math.min(Math.abs(ecart), 3.5 * dt)
      o.vx = Math.cos(cap) * vit
      o.vy = Math.sin(cap) * vit
    }
    // (UN TIR INFAILLIBLE file droit vers l'insecte auquel il est accroché, là où il est ; plus près qu'un pas, il est sur
    // lui — la touche se fait plus bas, comme pour les autres)
    let bouge = true
    if (o.verrou !== undefined) {
      const e = m.ennemis.find((x) => x.id === o.verrou)
      if (e === undefined) delete o.verrou
      else {
        const dx = e.corps.x - o.x
        const dy = e.corps.y - o.y
        const d = Math.hypot(dx, dy)
        const vit = Math.hypot(o.vx, o.vy)
        if (d <= vit * dt) (o.x = e.corps.x), (o.y = e.corps.y), (bouge = false)
        else (o.vx = (dx / d) * vit), (o.vy = (dy / d) * vit)
        // (il ne meurt pas en route vers elle)
        o.vie = Math.max(o.vie, dt)
      }
    }
    const ox = o.x
    const oy = o.y
    // (une grenade à retardement freine — voir `Arme.minuterie`)
    if (o.minuterie !== undefined) {
      const f = Math.exp(-o.minuterie * dt)
      o.vx *= f
      o.vy *= f
    }
    if (bouge) {
      o.x += o.vx * dt
      o.y += o.vy * dt
    }
    // (SA COURSE LAISSE UN SILLON — voir `Arme.sillon` : un segment par pas, au sillon de la balle)
    if (o.sillon !== undefined && (o.x !== ox || o.y !== oy)) {
      let si = m.sillons.find((x) => x.balle === o.id)
      if (si === undefined) {
        si = { balle: o.id, segments: [], nee: m.t, duree: o.sillon.duree, dps: o.sillon.dps, largeur: o.sillon.largeur, ...(o.sillon.gel === undefined ? {} : { gel: o.sillon.gel }), ...(o.sillon.electrocution === undefined ? {} : { electrocution: o.sillon.electrocution }) }
        m.sillons.push(si)
        ev.push({ type: 'sillon', x: ox, y: oy, gel: o.sillon.gel !== undefined, electrique: o.sillon.electrocution !== undefined })
      }
      si.segments.push({ x0: ox, y0: oy, x1: o.x, y1: o.y })
    }
    let fini = o.vie <= 0
    let eclate = false
    // (CE QU'UN OBUS PEUT TOUCHER : les insectes, ET LES ROCHES QUI DÉRIVENT même masquées — Keko, 20/11 : « je tire sur un
    // ennemi, il y a un astéroïde entre moi et l'ennemi, et mon projectile traverse l'astéroïde comme s'il n'était pas
    // là » : `rochesMasquees` ne retire les roches qu'au choix des cibles ; sur la course du tir, elles sont là — le
    // napalm passe au-dessus, comme d'un insecte)
    const touchables = masquees.length > 0 ? [...m.ennemis, ...masquees] : m.ennemis
    // (LE VERROU NE CHANGE PAS CE QUI EST TOUCHÉ — Keko, 23/11 : un tir vers l'ennemi verrouillé a survolé un temps tout le
    // reste jusqu'à lui ; « finalement, c'est une mauvaise idée : si des ennemis sont entre l'ennemi verrouillé et le joueur,
    // ils arrêtent le projectile, comme c'était avant »)
    const abattre = (e: Ennemi): void => {
      abattreLEnnemi(c, m, e, ev)
      // (une roche masquée brisée ne revient pas avec les autres)
      const k = masquees.indexOf(e)
      if (k >= 0) masquees.splice(k, 1)
    }
    // (une boule de napalm ne touche rien en vol : elle passe au-dessus ; à terre, elle devient une flaque)
    if (fini && o.napalm !== undefined) {
      m.flaques.push({ id: m.prochainId++, x: o.x, y: o.y, nee: m.t, ...o.napalm })
      ev.push({ type: 'flaque', x: o.x, y: o.y, rayon: o.napalm.rayon })
    }
    // (UN ÉCLAT QUI TRAVERSE : il touche tout ce qu'il croise, une fois chacun, et continue)
    if (!fini && o.perce !== undefined) {
      // (UNE BALLE DE RAILGUN — voir `Arme.balle` : tout ce que sa course du pas a croisé, dans l'ordre où elle l'a croisé)
      const ba = o.balle
      const croises = ba === undefined ? touchables : touchables.filter((e) => !o.perce!.includes(e.id) && distanceAuSegment(e.corps.x, e.corps.y, ox, oy, o.x, o.y) <= rayonDe(c, e) + ba.calibre).sort((p, q) => Math.hypot(p.corps.x - ox, p.corps.y - oy) - Math.hypot(q.corps.x - ox, q.corps.y - oy))
      for (const e of [...croises]) {
        if (o.perce.includes(e.id) || (ba === undefined && Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > rayonDe(c, e) + 1.5)) continue
        o.perce.push(e.id)
        // (UN TIR INFAILLIBLE QUI TRAVERSE lâche sa cible une fois sur elle, et file droit — voir `Arme.perforant`)
        if (o.verrou === e.id) delete o.verrou
        if (o.gel !== undefined) geler(c, m, e, o.gel.duree, o.gel.ralenti, ev, true)
        if (o.brule !== undefined) enflammer(c, m, e, o.brule)
        if (o.electrocution !== undefined) electrocuter(c, m, e, o.electrocution, ev, true)
        const coup = coupDObus(c, m, o, e)
        e.pv -= coup.degats
        // (UN CRITIQUE QUI EXÉCUTE abat net ce qui n'est ni grand ni roche — voir `Arme.execute` ; s'il en réchappait, la page
        // le montre)
        if (coup.critique && o.execute === true && e.asteroide === undefined && e.grand !== true && e.pv > 0) {
          e.pv = 0
          ev.push({ type: 'execution', x: e.corps.x, y: e.corps.y, rayon: rayonDe(c, e) })
        }
        ev.push({ type: 'ennemiTouche', id: e.id, x: ba === undefined ? o.x : e.corps.x, y: ba === undefined ? o.y : e.corps.y, critique: coup.critique })
        // (la balle perd une part de ses dégâts ; ses éclats partent de l'insecte traversé)
        if (ba !== undefined) {
          ev.push({ type: 'balleTraverse', x: e.corps.x, y: e.corps.y, cap: Math.atan2(o.vy, o.vx) })
          if (o.fragments !== undefined) fragmenter(m, e.corps.x, e.corps.y, o.fragments, e)
          o.degats = Math.max(1, Math.round(o.degats * ba.part))
        }
        if (e.pv <= 0) abattre(e)
      }
    }
    // (un obus en cloche non plus : il passe au-dessus — voir `Arme.cloche`)
    if (!fini && o.napalm === undefined && o.cloche !== true && o.minuterie === undefined && o.perce === undefined) {
      for (const e of touchables) {
        if (o.deja?.includes(e.id) === true || Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > rayonDe(c, e) + 1.5) continue
        fini = true
        // (un éclat de glace gèle ce qu'il touche — avant le coup : mort, il vole en éclats)
        if (o.gel !== undefined) geler(c, m, e, o.gel.duree, o.gel.ralenti, ev, true)
        if (o.brule !== undefined) enflammer(c, m, e, o.brule)
        if (o.ronge !== undefined) ronger(c, m, e, { ...o.ronge, dps: 0 }, ev)
        if (o.electrocution !== undefined) electrocuter(c, m, e, o.electrocution, ev, true)
        const coup = coupDObus(c, m, o, e)
        e.pv -= coup.degats
        if (coup.critique && o.execute === true && e.asteroide === undefined && e.grand !== true && e.pv > 0) {
          e.pv = 0
          ev.push({ type: 'execution', x: e.corps.x, y: e.corps.y, rayon: rayonDe(c, e) })
        }
        ev.push({ type: 'ennemiTouche', id: e.id, x: o.x, y: o.y, critique: coup.critique })
        // (UN COUP CRITIQUE DÉTONE autour de l'insecte touché — rebonds compris — voir `Arme.detonation`)
        if (coup.critique && o.detonation !== undefined) exploser(c, m, e.corps.x, e.corps.y, { rayon: o.detonation.rayon, degats: coup.degats * o.detonation.part }, e, ev, o.arme, true)
        if (e.pv <= 0) abattre(e)
        // (LE RICOCHET : il repart vers l'ennemi le plus proche, affaibli — voir `Arme.ricochet`)
        if (o.rebonds !== undefined && o.rebonds.n > 0) {
          let suite: Ennemi | null = null
          let ds = o.rebonds.portee
          for (const f of m.ennemis) {
            // (IL PEUT REVENIR SUR UN INSECTE DÉJÀ TOUCHÉ, PAS SUR CELUI QU'IL QUITTE — Keko, 23/11 : « permettre au laser de
            // retoucher une cible déjà touchée, du moment qu'elle est différente de la précédente ; ça distingue bien
            // l'attaque de la chaîne d'éclair » : il ne les excluait plus tous)
            if (f === e || f.asteroide !== undefined) continue
            const d = Math.hypot(f.corps.x - o.x, f.corps.y - o.y)
            if (d < ds) (ds = d), (suite = f)
          }
          if (suite !== null) {
            // (SA ZONE ÉCLATE À CHAQUE IMPACT, REBONDS COMPRIS — la carte « Impulsion » avec le ricochet : il partait sans
            // éclater ; la zone s'affaiblit avec lui)
            if (o.zone !== undefined) {
              exploser(c, m, o.x, o.y, o.zone, e, ev, o.arme)
              o.zone = { ...o.zone, degats: o.zone.degats * o.rebonds.part }
            }
            fini = false
            const vit = Math.hypot(o.vx, o.vy) || 1
            o.vx = ((suite.corps.x - o.x) / (ds || 1)) * vit
            o.vy = ((suite.corps.y - o.y) / (ds || 1)) * vit
            o.verrou = suite.id
            o.deja = [e.id]
            // (CHAQUE REBOND TIRE SON PROPRE COUP CRITIQUE — Keko, 23/11 : « chaque ricochet qui fait un coup critique a une
            // chance de déclencher la détonation ; avec un seul tir, on peut déclencher autant de détonations que de
            // ricochets » : le critique était tiré une fois au départ, et tous les rebonds le suivaient ; il repart de ses
            // dégâts sans critique, affaiblis)
            if (o.brut !== undefined) {
              const a = c.armes.find((x) => x.id === o.arme)
              o.brut *= o.rebonds.part
              o.critique = critiqueTire(c, m, a)
              o.degats = o.brut * (o.critique ? facteurDeCritique(c, a) : 1)
            } else o.degats *= o.rebonds.part
            o.rebonds = { ...o.rebonds, n: o.rebonds.n - 1 }
            o.vie = Math.max(o.vie, 0.4)
            ev.push({ type: 'obus', x: o.x, y: o.y, arme: o.arme })
            break
          }
        }
        if (o.zone !== undefined) exploser(c, m, o.x, o.y, o.zone, e, ev, o.arme)
        if (o.zone !== undefined && o.fragments !== undefined) fragmenter(m, o.x, o.y, o.fragments, e)
        // (UN ÉCLAT QUI SE BRISE : ses petits fragments filent en cône derrière l'insecte, sans le retoucher)
        if (o.eclatement !== undefined) {
          const ec = o.eclatement
          const cap = Math.atan2(o.vy, o.vx)
          // (une seule liste pour tous les fragments d'un éclat : un insecte n'en prend qu'un coup, même s'il est dans tout le cône)
          const dejaTouches = [e.id]
          for (let k = 0; k < ec.nombre; k++) {
            const an = cap + (ec.nombre === 1 ? 0 : (k / (ec.nombre - 1) - 0.5) * ec.cone)
            m.obus.push({ id: m.prochainId++, x: o.x, y: o.y, vx: Math.cos(an) * ec.vitesse, vy: Math.sin(an) * ec.vitesse, vie: ec.vie, degats: ec.degats, guide: false, arme: 'fragment', perce: dejaTouches, ...(o.gel === undefined ? {} : { gel: o.gel }) })
          }
          ev.push({ type: 'eclatement', x: o.x, y: o.y, cap })
        }
        eclate = true
        break
      }
    }
    // (LES ARMES ENTAMENT LES ROCHES — Keko, 12/11 : l'obus qui s'écrase sur une roche l'abîme de ses dégâts ; brisée
    // ainsi, elle ne rend que sa part forée — l'obus en cloche passe au-dessus)
    if (!fini && o.cloche !== true && o.minuterie === undefined) {
      const a = asteroidesVisibles(c, m, o.x, o.y, c.champ.rayonMax + 2).find((r) => Math.hypot(o.x - r.x, o.y - r.y) <= r.rayon)
      if (a !== undefined) {
        fini = true
        abimerLaRoche(c, m, { x: o.x, y: o.y, force: 0, asteroide: a.id }, o.degats, ev)
      }
    }
    // (un mini-missile au bout de sa course explose aussi, là où il est — et l'orbe de plasma, c'est là qu'elle éclate)
    // (le test disait `!fini`, et `fini` est vrai dès que la course est finie : il n'explosait jamais — 16/11)
    if (o.vie <= 0 && o.zone !== undefined && !eclate) {
      // (UN TIR QUI NE TOUCHE RIEN EN VOL — l'obus en cloche, la grenade à retardement — enflamme et gèle TOUTE SA ZONE :
      // sans contact, le feu et le gel de ses cartes ne prendraient nulle part)
      if (o.cloche === true || o.minuterie !== undefined) {
        for (const e of m.ennemis) {
          if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > o.zone.rayon + rayonDe(c, e)) continue
          if (o.gel !== undefined) geler(c, m, e, o.gel.duree, o.gel.ralenti, ev, true)
          if (o.brule !== undefined) enflammer(c, m, e, o.brule)
          if (o.electrocution !== undefined) electrocuter(c, m, e, o.electrocution, ev, true)
        }
      }
      exploser(c, m, o.x, o.y, o.zone, null, ev, o.arme)
      if (o.fragments !== undefined) fragmenter(m, o.x, o.y, o.fragments, null)
    }
    if (fini) m.obus.splice(i, 1)
  }

  // LES BOMBES volent, puis éclatent — au bout de leur vie, ou au contact d'une roche ou d'un rival
  for (let i = m.bombes.length - 1; i >= 0; i--) {
    const b = m.bombes[i]
    b.vie -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    let eclate = b.vie <= 0
    if (!eclate) eclate = m.ennemis.some((e) => Math.hypot(e.corps.x - b.x, e.corps.y - b.y) <= rayonDe(c, e) + 3)
    if (!eclate) eclate = asteroidesVisibles(c, m, b.x, b.y, c.champ.rayonMax + 3).some((a) => Math.hypot(b.x - a.x, b.y - a.y) <= a.rayon + 1)
    if (!eclate) continue
    m.bombes.splice(i, 1)
    ev.push({ type: 'explosion', x: b.x, y: b.y, rayon: c.bombe.rayon })
    for (const a of asteroidesVisibles(c, m, b.x, b.y, c.bombe.rayon + c.champ.rayonMax)) if (Math.hypot(b.x - a.x, b.y - a.y) - a.rayon <= c.bombe.rayon) eclaterLaRoche(c, m, a, ev)
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - b.x, e.corps.y - b.y) > c.bombe.rayon + rayonDe(c, e)) continue
      e.pv -= c.bombe.degats
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
  propagerLElectrocution(c, m, ev)
  propagerLeFeu(c, m, dt, ev)
  menerLAuraGlaciale(c, m, ev)
  majorerParLAcide(c, m, avantLAcide, ev)
  if (masquees.length > 0) m.ennemis = [...m.ennemis, ...masquees]

  // L'EXTRACTION, à la station la plus proche : à quai (après être sorti une fois d'un parvis), le compte monte ; hors
  // du parvis il redescend ; au bout, la partie est extraite et tout le minerai porté passe en banque
  const st = stationLaPlusProche(c, v.x, v.y)
  if (Math.hypot(v.x - st.x, v.y - st.y) <= c.station.portee) {
    if (m.sorti) {
      m.extraction += dt
      if (m.extraction >= c.extraction.duree) {
        m.extraction = c.extraction.duree
        m.phase = 'extrait'
        const pepites = m.minerai
        const cargaison = { ...m.cargaison }
        m.banque += pepites
        m.minerai = 0
        for (const k of MINERAIS) {
          m.tresor[k] += m.cargaison[k]
          m.cargaison[k] = 0
        }
        ev.push({ type: 'extrait', x: st.x, y: st.y, pepites, cargaison })
      }
    }
  } else {
    m.extraction = Math.max(0, m.extraction - dt)
    m.sorti = true
  }

  // les traits : ils volent, s'éteignent, s'écrasent sur une roche, touchent le joueur
  for (let i = m.tirs.length - 1; i >= 0; i--) {
    const tr = m.tirs[i]
    tr.vie -= dt
    if (tr.guide && m.phase === 'vol') {
      // (un missile du rival tourne vers le joueur)
      const vit = Math.hypot(tr.vx, tr.vy)
      const ecart = ecartDAngle(Math.atan2(tr.vy, tr.vx), Math.atan2(v.y - tr.y, v.x - tr.x))
      const cap = Math.atan2(tr.vy, tr.vx) + Math.sign(ecart) * Math.min(Math.abs(ecart), c.ennemi.guidage * dt)
      tr.vx = Math.cos(cap) * vit
      tr.vy = Math.sin(cap) * vit
    }
    tr.x += tr.vx * dt
    tr.y += tr.vy * dt
    let fini = tr.vie <= 0
    if (!fini && m.phase === 'vol' && Math.hypot(tr.x - v.x, tr.y - v.y) <= c.rayon + 1) {
      fini = true
      encaisser(c, m, tr.x, tr.y, tr.degats ?? 1, ev)
    }
    if (!fini) for (const a of asteroidesVisibles(c, m, tr.x, tr.y, c.champ.rayonMax + 2)) if (Math.hypot(tr.x - a.x, tr.y - a.y) <= a.rayon) fini = true
    if (fini) m.tirs.splice(i, 1)
  }

  // les pépites : elles dérivent en freinant, viennent au vaisseau le plus proche à portée d'aimant, montent à bord au contact
  // (dans l'invasion, les insectes ne ramassent rien : les pépites sont au joueur)
  const corps: { x: number; y: number; par: 'joueur' | 'ennemi'; e: Ennemi | null }[] = [{ x: v.x, y: v.y, par: 'joueur', e: null }, ...(c.invasion.active ? [] : m.ennemis.map((e) => ({ x: e.corps.x, y: e.corps.y, par: 'ennemi' as const, e })))]
  // (À PLUSIEURS, UNE PÉPITE VA AU VAISSEAU EN VOL LE PLUS PROCHE D'ELLE, et celle qu'un autre aimante est à lui : elles
  // attendent son tour — voir `avancerLEquipage`)
  const ici = m.equipage?.actif ?? 0
  const autres = m.equipage === undefined ? [] : vaisseauxEnVol(m).filter((x) => x.k !== ici)
  for (let i = m.pepites.length - 1; i >= 0; i--) {
    const p = m.pepites[i]
    // (EMPORTÉE PAR L'ANNEAU D'UNE BOULE : c'est elle qui la mène — voir `menerLesSpheres` ; la boule partie, elle est relâchée)
    if (p.emportee !== undefined) {
      if (m.spheres.some((s) => s.id === p.emportee)) continue
      delete p.emportee
    }
    // (UNE PLAQUE, UN SOIN NE VONT QU'À QUI EN MANQUE — voir `recuperation`, `invasion.soin` : à plusieurs, au plus proche
    // de ceux-là ; personne n'en manque, ils flottent, au plus proche de tous)
    const reserve = p.plaque === true || p.soin === true
    const enManque = (x: { plaques: boolean[]; coque: number; coqueMax?: number }): boolean => (p.plaque === true ? x.plaques.includes(false) : x.coque < (x.coqueMax ?? Infinity) - 1e-6)
    const manqueIci = reserve && enManque(m)
    let rivaux = autres
    if (reserve && m.equipage !== undefined) {
      const enManquent = autres.filter((x) => enManque(m.equipage!.pilotes[x.k]))
      if (manqueIci || enManquent.length > 0) {
        if (!manqueIci) continue
        rivaux = enManquent
      }
    }
    if (rivaux.length > 0) {
      if (p.aimanteeA !== undefined && (p.par ?? 0) !== ici && rivaux.some((x) => x.k === (p.par ?? 0))) continue
      if (p.aimanteeA === undefined && rivaux.some((x) => Math.hypot(x.v.x - p.x, x.v.y - p.y) < Math.hypot(v.x - p.x, v.y - p.y))) continue
    }
    let plusProche = corps[0]
    let dmin = Infinity
    for (const b of corps) {
      const d = Math.hypot(b.x - p.x, b.y - p.y)
      if (d < dmin) (dmin = d), (plusProche = b)
    }
    const dx = plusProche.x - p.x
    const dy = plusProche.y - p.y
    const d = dmin || 1
    // LA SOUTE PLEINE (la capacité de la coque — Keko), ou LE MINERAI REFUSÉ : la pépite reste là, ni ramassée ni aimantée
    // (… ET LA PLAQUE, pour qui n'en manque pas : elle reste là, elle aussi)
    const soutePleine = (!c.invasion.active && plusProche.e === null && (m.minerai >= c.capacite || m.refuses[p.minerai])) || (reserve && !manqueIci)
    // (LE JOUEUR QUI REVIENT N'AIMANTE RIEN TANT QU'IL EST INVINCIBLE — Keko, 21/11 : « que les pépites ne soient pas attirées
    // immédiatement quand on respawn, qu'on attende la fin de l'animation : pile au retour, ça lance un gain de niveau la
    // plupart du temps » — l'explosion du retour en sème tout autour ; voir `invasion.retour`)
    const attend = c.invasion.active && m.t < m.renaitJusque
    // (UNE PLAQUE, UN SOIN NE S'AIMANTENT PAS — Keko, 22/11 : « je veux pas que les soins soient attirés par l'aimant, ni le
    // surblindage » : on les prend en passant dessus, le vaisseau les touche)
    // (… NI L'AIMANT LUI-MÊME — Keko, 22/11 : « je veux pas que l'aimant soit lui-même aimanté non plus »)
    const aPasser = reserve || p.aimant === true
    const ramassage = aPasser ? Math.max(c.forage.ramassage, c.rayon + c.forage.margeDesObjets) : c.forage.ramassage
    if (d <= ramassage && !soutePleine && !attend) {
      m.pepites.splice(i, 1)
      if (c.invasion.active) gagnerLaPepite(c, m, p, ev)
      else if (plusProche.e === null) {
        m.minerai += 1
        m.cargaison[p.minerai] += 1
      } else {
        plusProche.e.butin += 1
        plusProche.e.cargaison[p.minerai] += 1
      }
      ev.push({ type: 'ramasse', x: p.x, y: p.y, par: plusProche.par, minerai: p.minerai })
      continue
    }
    // UNE PÉPITE AIMANTÉE PAR LE JOUEUR FINIT TOUJOURS À BORD (Keko, 20/11 : « quand une pépite est aimantée, elle doit
    // augmenter en vitesse : j'aimante une pépite et si je m'éloigne trop vite, je la perds ; une pépite aimantée devrait
    // toujours finir par être capturée ») : prise une fois, elle ne le lâche plus, où qu'il aille — elle fonce droit sur
    // lui, de plus en plus vite (`accelerationAimantee` par seconde, depuis `vitessePepite` au moins), et toujours plus
    // vite que lui ; la soute pleine ou le minerai refusé la relâchent
    const aimanteParLui = !attend && p.aimanteeA !== undefined && !soutePleine
    if (aimanteParLui) {
      const jx = v.x - p.x
      const jy = v.y - p.y
      const dj = Math.hypot(jx, jy) || 1
      if (dj <= c.forage.ramassage + Math.hypot(v.vx, v.vy) * dt * 2) {
        // (à bord : la même chose que plus haut, pour le joueur)
        m.pepites.splice(i, 1)
        if (c.invasion.active) gagnerLaPepite(c, m, p, ev)
        else {
          m.minerai += 1
          m.cargaison[p.minerai] += 1
        }
        ev.push({ type: 'ramasse', x: p.x, y: p.y, par: 'joueur', minerai: p.minerai })
        continue
      }
      const vite = Math.max(c.forage.vitessePepite + c.forage.accelerationAimantee * (m.t - (p.aimanteeA ?? m.t)), Math.hypot(v.vx, v.vy) + 60)
      const pasMax = Math.min(vite * dt, dj)
      p.vx = (jx / dj) * vite
      p.vy = (jy / dj) * vite
      p.x += (jx / dj) * pasMax
      p.y += (jy / dj) * pasMax
      continue
    }
    if (p.aimanteeA !== undefined) delete p.aimanteeA
    const frein = Math.exp(-2.5 * dt)
    p.vx *= frein
    p.vy *= frein
    const aimant = c.forage.aimant * (plusProche.e === null ? c.foreuse.aimant : 1) // (l'aimant du joueur suit sa foreuse)
    if (d <= aimant && !soutePleine && !attend && !aPasser && plusProche.e === null && c.forage.accelerationAimantee > 0) {
      p.aimanteeA = m.t
      if (m.equipage !== undefined) p.par = ici
    }
    if (d <= aimant && !soutePleine && !attend && !aPasser) {
      const tirage = c.forage.vitessePepite * (1 - d / aimant) + 40
      p.vx += (dx / d) * tirage * dt * 6
      p.vy += (dy / d) * tirage * dt * 6
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  return { chocs, evenements: ev }
}

/**
 * L'ÉQUIPAGE — PLUSIEURS VAISSEAUX DANS UN MÊME MONDE (Keko, 22/11 : « Tente l'étape 1 » — deux vaisseaux dans le même
 * monde, le second piloté par un second manche sur le même écran, avant le réseau). LE MONDE EST COMMUN : le temps, les
 * insectes, les roches, la tempête, les pépites, l'expérience et le niveau. CHAQUE PILOTE A LE SIEN : son vaisseau, sa
 * coque, son bouclier, ses plaques, ses armes et tout ce qu'elles ont lancé ou posé, son verrou, sa mort et son retour.
 * La règle d'un vaisseau ne change pas : le pilote dont c'est le tour est DANS le monde — ses champs sont ceux de
 * `Monde` —, les autres attendent dans `equipage.pilotes` ; `prendreLaMain` les échange.
 */
export const CHAMPS_DU_PILOTE = ['phase', 'vaisseau', 'coque', 'coqueMax', 'tableau', 'bouclier', 'plaques', 'intouchableJusque', 'corruption', 'dephaseJusque', 'plaqueCasseeA', 'renaitJusque', 'toucheA', 'forage', 'forages', 'tirs', 'obus', 'armesA', 'extraction', 'sorti', 'boostA', 'bombes', 'charges', 'verrou', 'crache', 'drones', 'tourelles', 'flaques', 'balayage', 'rayonVu', 'canal', 'harpons', 'rafales', 'rafaleDesAiles', 'salveDesAiles', 'faisceaux', 'sillons', 'balisesLaser', 'scies', 'balises', 'givres', 'tornades', 'novas', 'echardes', 'spheres', 'puits', 'meteores', 'tentacules', 'nuees', 'rejetons', 'flaquesAcides', 'mines', 'fleaux', 'parasites', 'brochettes', 'hypercubes', 'coupes', 'des', 'oeufs', 'miniVers', 'liens', 'vrilles'] as const
/** Un pilote qui attend son tour : ses champs du monde, l'instant de son retour s'il est abattu, les morsures qu'il doit encaisser. */
export type Pilote = Pick<Monde, (typeof CHAMPS_DU_PILOTE)[number]> & { retourA: number; morsures: { x: number; y: number; degats: number }[] }
/** Les pilotes (celui dont c'est le tour, `actif`, a sa place gardée mais périmée : il est dans le monde). */
export type Equipage = { pilotes: Pilote[]; actif: number }

function sortirLePilote(m: Monde, morsures: Pilote['morsures'] = []): Pilote {
  const p = { retourA: m.invasion.retourA, morsures } as Pilote
  for (const k of CHAMPS_DU_PILOTE) (p as Record<string, unknown>)[k] = m[k]
  return p
}

/** Le pilote `k` prend le monde : celui qui l'avait retourne attendre. */
export function prendreLaMain(m: Monde, k: number): void {
  const eq = m.equipage
  if (eq === undefined || eq.actif === k) return
  eq.pilotes[eq.actif] = sortirLePilote(m, eq.pilotes[eq.actif].morsures)
  const p = eq.pilotes[k]
  for (const c of CHAMPS_DU_PILOTE) (m as Record<string, unknown>)[c] = p[c]
  m.invasion.retourA = p.retourA
  eq.actif = k
}

/** Ce qu'est le pilote `k` à cet instant (celui dont c'est le tour : lu dans le monde). */
export function etatDuPilote(m: Monde, k: number): Pilote {
  const eq = m.equipage
  if (eq === undefined || eq.actif === k) return sortirLePilote(m)
  return eq.pilotes[k]
}

/** Un pilote de plus, de la configuration `c`, son vaisseau posé à (dx, dy) du premier. */
export function ajouterUnPilote(c: ConfigVaisseau, m: Monde, dx: number, dy: number): void {
  if (m.equipage === undefined) m.equipage = { pilotes: [sortirLePilote(m)], actif: 0 }
  const neuf = nouveauMonde(c, m.graine)
  neuf.vaisseau = { ...neuf.vaisseau, x: m.vaisseau.x + dx, y: m.vaisseau.y + dy, cap: m.vaisseau.cap }
  neuf.invasion.retourA = 0
  m.equipage.pilotes.push(sortirLePilote(neuf))
}

/** Les vaisseaux en vol, et à qui ils sont (seul : le joueur, s'il vole). */
export function vaisseauxEnVol(m: Monde): { k: number; v: Vaisseau }[] {
  const eq = m.equipage
  if (eq === undefined) return m.phase === 'vol' ? [{ k: 0, v: m.vaisseau }] : []
  return eq.pilotes.flatMap((p, k) => {
    const phase = k === eq.actif ? m.phase : p.phase
    return phase === 'vol' ? [{ k, v: k === eq.actif ? m.vaisseau : p.vaisseau }] : []
  })
}

/** À plusieurs : plus d'un pilote dans l'équipage. */
export const aPlusieurs = (m: Monde): boolean => m.equipage !== undefined && m.equipage.pilotes.length > 1

/** Combien d'AUTRES pilotes en vol sont dans le cercle du retour de celui dont c'est le tour (voir `invasion.vies`). */
export function alliesAuRetour(c: ConfigVaisseau, m: Monde): number {
  const eq = m.equipage
  if (eq === undefined) return 0
  const o = pointDeRetour(c, m)
  return vaisseauxEnVol(m).filter((x) => x.k !== eq.actif && Math.hypot(x.v.x - o.x, x.v.y - o.y) <= c.invasion.retour.rayon).length
}

/** LE MILIEU DE L'ÉQUIPAGE : celui des vaisseaux en vol — personne : le vaisseau dont c'est le tour (seul : le sien). */
/**
 * À PLUSIEURS, POUR QUI NAÎT CE QUI NAÎT (Keko, 22/11 : « je voudrais qu'ils puissent partir dans des directions
 * complètement différentes ») : un des vaisseaux en vol, à tour de rôle (`cle`) — personne : celui dont c'est le tour.
 */
function pilotePourNaitre(m: Monde, cle: number): Vaisseau {
  const vs = vaisseauxEnVol(m)
  return vs.length === 0 ? m.vaisseau : vs[((cle % vs.length) + vs.length) % vs.length].v
}

/** D'OÙ SE COMPTENT LES ROCHES QUI DÉRIVENT : seul, le centre des roches ; à plusieurs, chaque vaisseau en vol. */
function lieuxDesRoches(c: ConfigVaisseau, m: Monde): Vecteur[] {
  if (m.equipage === undefined) return [centreDesRoches(c, m)]
  const vs = vaisseauxEnVol(m)
  return vs.length === 0 ? [centreDesRoches(c, m)] : vs.map((x) => x.v)
}

function centreDeLEquipage(m: Monde): Vecteur {
  const vs = m.equipage === undefined ? [] : vaisseauxEnVol(m)
  if (vs.length === 0) return { x: m.vaisseau.x, y: m.vaisseau.y }
  return { x: vs.reduce((s, x) => s + x.v.x, 0) / vs.length, y: vs.reduce((s, x) => s + x.v.y, 0) / vs.length }
}

/** Le vaisseau en vol le plus proche de ce point, ou null : personne ne vole. */
function cibleDeLInsecte(m: Monde, b: Vecteur): { k: number; v: Vaisseau } | null {
  // (seul, sans rien chercher : à chaque insecte, à chaque pas)
  if (m.equipage === undefined) return m.phase === 'vol' ? { k: 0, v: m.vaisseau } : null
  let meilleur: { k: number; v: Vaisseau } | null = null
  let dm = Infinity
  for (const x of vaisseauxEnVol(m)) {
    const d = Math.hypot(x.v.x - b.x, x.v.y - b.y)
    if (d < dm) (dm = d), (meilleur = x)
  }
  return meilleur
}

/**
 * UN PAS DE L'ÉQUIPAGE : LE MONDE COMMUN AVANCE UNE FOIS, au tour du premier pilote en vol (personne : le premier) — le
 * temps, les naissances, les insectes, les roches —, puis CHAQUE AUTRE PILOTE A SON TOUR, sans lui : il encaisse les
 * morsures qui l'attendaient, vole, tire, ramasse. Les deux tours sont ceux d'un vaisseau seul (`avancerLeMonde`,
 * `seul`). Ensuite la laisse (voir `equipage.laisse`) ; le premier pilote reprend le monde. Rend les chocs et les
 * événements de chacun. `regardDe(k)` : où regarde le pilote `k` — demandé quand il est dans le monde.
 */
// (`laisse` : la laisse les garde ensemble — à l'écran partagé ; à distance, chacun va où il veut)
export function avancerLEquipage(cs: ConfigVaisseau[], m: Monde, dt: number, directions: Vecteur[], regardDe?: (k: number) => Vecteur | undefined, laisse = true): { chocs: Choc[][]; evenements: Evenement[][] } {
  const eq = m.equipage
  if (eq === undefined) {
    const r = avancerLeMonde(cs[0], m, dt, directions[0] ?? { x: 0, y: 0 }, regardDe?.(0))
    return { chocs: [r.chocs], evenements: [r.evenements] }
  }
  const n = eq.pilotes.length
  const phaseDe = (k: number): Monde['phase'] => (k === eq.actif ? m.phase : eq.pilotes[k].phase)
  let chef = 0
  while (chef < n && phaseDe(chef) !== 'vol') chef++
  if (chef === n) chef = 0
  const chocs: Choc[][] = Array.from({ length: n }, () => [])
  const evenements: Evenement[][] = Array.from({ length: n }, () => [])
  const tour = (k: number, seul: boolean): void => {
    prendreLaMain(m, k)
    const c = cs[k] ?? cs[0]
    const ev: Evenement[] = []
    for (const mo of eq.pilotes[k].morsures.splice(0)) if (m.phase === 'vol') encaisser(c, m, mo.x, mo.y, mo.degats, ev)
    const r = avancerLeMonde(c, m, dt, directions[k] ?? { x: 0, y: 0 }, regardDe?.(k), false, seul)
    chocs[k] = r.chocs
    evenements[k] = [...ev, ...r.evenements]
  }
  tour(chef, false)
  for (let k = 0; k < n; k++) if (k !== chef) tour(k, true)
  prendreLaMain(m, 0)
  if (laisse) retenirLEquipage(cs[0], m, dt)
  return { chocs, evenements }
}

/**
 * LA LAISSE (voir `equipage.laisse`) : deux vaisseaux — ou une épave qui attend son retour — plus loin que la laisse l'un
 * de l'autre sont ramenés vers elle, chacun de sa moitié, en un dixième de seconde environ, et ce qui les écartait
 * encore est annulé.
 */
function retenirLEquipage(c: ConfigVaisseau, m: Monde, dt: number): void {
  const eq = m.equipage
  if (eq === undefined) return
  const L = c.equipage.laisse
  const lire = (k: number): Vaisseau => (k === eq.actif ? m.vaisseau : eq.pilotes[k].vaisseau)
  const poser = (k: number, w: Vaisseau): void => {
    if (k === eq.actif) m.vaisseau = w
    else eq.pilotes[k].vaisseau = w
  }
  for (let i = 0; i < eq.pilotes.length; i++)
    for (let j = i + 1; j < eq.pilotes.length; j++) {
      const a = lire(i)
      const b = lire(j)
      const d = Math.hypot(b.x - a.x, b.y - a.y)
      if (d <= L) continue
      const nx = (b.x - a.x) / d
      const ny = (b.y - a.y) / d
      const pas = ((d - L) / 2) * Math.min(1, dt * 10)
      const ecarte = Math.max(0, (b.vx - a.vx) * nx + (b.vy - a.vy) * ny) / 2
      poser(i, { ...a, x: a.x + nx * pas, y: a.y + ny * pas, vx: a.vx + nx * ecarte, vy: a.vy + ny * ecarte })
      poser(j, { ...b, x: b.x - nx * pas, y: b.y - ny * pas, vx: b.vx - nx * ecarte, vy: b.vy - ny * ecarte })
    }
}

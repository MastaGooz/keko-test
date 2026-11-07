# La tour du magicien — `?magie`, un side project

Keko (07/11), après la commande action : « je voudrais faire un autre test
de jeu : on a une tour au milieu de l'écran (la tour d'un magicien), avec
des ennemis qui approchent. Et on lance des sorts à la Magicka ».

## Les fichiers

- `src/logic/magie/jeu.ts` — pur et seedé : la file des éléments, la
  composition du sort, les trois formes, les ennemis, les vagues, la tour.
  Le temps est injecté, l'état modifié en place ; le monde a la tour à
  l'origine, y vers le bas ; la page dit ce qu'elle montre (`Vue`), où
  naissent les ennemis. Vérifié par `jeu.verif.ts` (dans `npm run verif`).
- `src/ui/magie/page.ts` + `magie.css` — le terrain vu de dessus, la tour au
  milieu de l'espace libre, le magicien dessus (le personnage du générateur,
  chapeau et bâton), les sorts, et en DOM la barre du haut, la file et les
  quatre éléments. Classes préfixées `magie-`. `sons.ts` : les sons, sur la
  mécanique de ceux des envahisseurs.

## Les décisions (de moi, à rejuger par Keko)

- **Six éléments** (Magicka en a huit) : feu, froid, foudre, terre, puis
  **vie et mort** (Keko, 07/11 : « on peut ajouter vie et mort, comme dans
  Magicka ? »). **Trois au plus dans la file** (Magicka : cinq). Les orbes de
  la file s'affichent en bas avec le nom du sort qu'elle lancerait, et
  tournent autour du magicien. Au clavier, 1 à 6.
- **LA ROUE SOUS LE DOIGT** (Keko, 07/11 : « ce serait sympa d'avoir un
  système plus ergonomique : on choisit les éléments dans une roue ? On tape
  et on slide dans le sens de l'élément, avec six quartiers ») — elle
  remplace les boutons (d'abord quatre, puis six sur une ligne, 48 px chacun
  sur un téléphone étroit : ça tenait, mais le pouce devait descendre tout
  en bas). On pose le doigt N'IMPORTE OÙ sur le terrain : la roue apparaît
  là (rayon 72 px) ; on glisse vers un quartier (18 px au moins) et on
  relâche pour ajouter l'élément ; on relâche SANS glisser pour lancer le
  sort vers le point touché. **Les opposés sont face à face** : feu en haut,
  froid en bas ; foudre en haut à droite, terre en bas à gauche ; vie en bas
  à droite, mort en haut à gauche (`ROUE`, le quartier i centré sur
  −90° + 60° × i). Le quartier visé s'allume et son nom s'affiche au-dessus.
  Une roue-légende (SVG, 3,2 rem) reste en bas à côté de la file pour
  apprendre les directions. Un `pointercancel` (le navigateur reprend le
  geste) n'ajoute ni ne lance rien.
- **Les opposés s'annulent en entrant** : le feu efface un froid de la file
  (et inversement), la foudre une terre, la vie une mort. Un ✕ vide la file.
- **La mort fait un RAYON** (l'arcane de Magicka) : une ligne droite depuis
  la tour, portée 44, qui transperce tout ce qu'elle croise à 3 unités de la
  ligne (8 dégâts par mort, 3 par autre élément) ; elle passe après la terre
  et la foudre (mort + terre = rocher de mort, mort + foudre = éclair de
  mort) mais avant le feu et le froid (mort + feu = rayon de mort ardent).
  **Son effet : elle affaiblit** — les touchés prennent 25 % de dégâts en
  plus par mort (75 % au plus) pendant 4 s ; un cerne violet le montre.
- **La vie soigne la tour.** Seule dans la file, c'est un **HALO** : la tour
  regagne 3 PV par vie (jusqu'à 20), et les morts-vivants à moins de 18
  unités brûlent (5 par vie, doublés par leur faiblesse). *La vie ne blesse
  pas les vivants* (faiblesse 0, sans afficher « Insensible » : c'est sa
  nature, pas une résistance). *Un premier essai la faisait **drainer** dans
  les autres sorts (1 PV à la tour par ennemi touché) ; l'élémentaire l'a
  remplacé le même jour.*
- **La vie + un élément d'attaque INVOQUE UN ÉLÉMENTAIRE** (Keko, 07/11 :
  « ce serait cool que vie + feu / glace / foudre / terre crée un petit
  élémentaire ») — cette forme passe avant toutes les autres. L'élément est
  *le premier élément d'attaque posé* (vie + foudre + feu : de foudre ; le
  troisième ne compte pas) ; **sa force, le nombre de fois où cet élément
  est dans le sort** (vie + feu + feu : frappe ×2) ; **sa durée, 10 s, plus
  5 s par vie en plus** (vie + vie + feu : 15 s). Il naît au point touché
  (à 30 unités de la tour au plus), court sur l'ennemi le plus proche et le
  frappe à sa cadence, à la manière de son élément : **le feu** (vitesse 9,
  au contact, toutes les 0,7 s, 2 par force) brûle ; **la glace** (8, au
  contact, 0,8 s, 2) ralentit ; **la foudre** (6, de loin — 16 unités —,
  0,9 s, 3) zappe sans bouger ; **la terre** (4, au contact, 1,2 s, 6)
  repousse. **Trois à la fois** : le plus vieux s'efface quand un quatrième
  naît. Les ennemis l'ignorent (ils marchent sur la tour) : il n'a pas de
  PV, seulement son temps, montré par un anneau vert à ses pieds. Dessiné
  comme une goutte de sa couleur, deux yeux, qui frétille.
- **Le squelette**, cinquième ennemi, dès la vague 5 : 18 PV, vitesse 5,5,
  2 par coup ; **la mort ne lui fait rien, la vie le brûle (double)**. Le
  même générateur que les autres, délavé en os (`filter: grayscale`), une
  brume verdâtre autour.
- **On lance en touchant le terrain** : le sort part vers ce point ; puis
  0,35 s de recharge.
- **La forme vient de la composition** : de la terre, un **rocher** jeté sur
  le point (il éclate là, ou sur le premier ennemi qu'il croise : 7 dégâts
  par terre dans 5 unités ; le feu élargit l'impact de 3 par feu, la terre
  repousse) ; sinon de la foudre, un **éclair** qui part sur l'ennemi le plus
  proche dans le cône visé, puis saute au plus proche (6 dégâts par foudre ;
  1 + 2 × foudre ennemis touchés) ; sinon un **souffle** en cône (5 dégâts
  par élément, portée 34, ±29°).
- **Les effets s'ajoutent** : le feu brûle (2 dégâts par seconde par feu,
  3 s), le froid ralentit (25 % par froid, 3 s ; trois froids gèlent 2 s),
  la terre repousse.
- **L'indication du sort** (Keko : « faudrait ajouter une indication (icône
  + nom), ex. feu + foudre = éclair de feu ») : à côté de la file, l'ICÔNE de
  la forme (le rocher, l'éclair, le souffle), tracée à la couleur de son
  élément et remplie de celle de l'élément qui la modifie ; le NOM (Éclair,
  Éclair de feu, Éclair de givre, Rocher, Rocher de feu, Rocher de glace,
  Jet de flammes, Souffle de givre, ×2 ou ×3) ; dessous, la RECETTE et ce
  que fera le sort (« Feu + Foudre · saute sur 3 ennemis · brûle »,
  `effetsDuSort`). Au lancer, le nom s'affiche au-dessus de la tour.
  **Cette ligne a une hauteur fixe** (Keko : « l'UI en bas change de taille
  selon le nombre de lignes du titre, c'est perturbant ») : le nom sur une
  ligne, la recette sur deux au plus — le panneau ne bouge plus, ni la tour,
  qui se centre dessus.
- **Cinq ennemis**, chacun sa vague d'arrivée :

  | ennemi | dès la vague | PV | vitesse | coup sur la tour | faiblesse |
  |---|---|---|---|---|---|
  | Gobelin | 1 | 10 | 7 | 1 | — |
  | Orc | 2 | 30 | 4,5 | 3 | — |
  | Esprit de feu | 3 | 14 | 6,5 | 2 | insensible au feu, le froid double |
  | Golem | 4 | 40 | 3,5 | 4 | la foudre ×0,25, le feu ×0,5, la terre double |
  | Squelette | 5 | 18 | 5,5 | 2 | insensible à la mort, la vie double |

  Le type nouveau d'une vague ouvre la marche, seul.
- **Les vagues** : 4 + 2 × (n − 1) ennemis sur 14 s, nés juste hors de
  l'écran ; leurs PV +12 % par vague ; 3 s de pause entre deux vagues, la
  tour regagne 2 PV (20 au plus). Au pied de la tour, un ennemi frappe toutes
  les 1,2 s.
- **Le record est la vague atteinte** (`keko-magie-record`).
- L'écran montre 56 unités de large (la tour au milieu de l'espace libre
  entre la barre du haut et le panneau du bas) : à 80, tout était minuscule.
- Mesuré par un robot qui vise l'ennemi le plus proche avec le bon sort
  (trois froids sur l'esprit, trois terres sur le golem, trois feux de
  près, trois foudres de loin) : un sort par seconde, il tombe aux vagues 8
  à 10 ; un toutes les 2,5 s, aux vagues 3 ou 4. Sans un sort, la tour
  tombe dans la première vague.

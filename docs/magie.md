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

- **Quatre éléments** (Magicka en a huit) : feu, froid, foudre, terre, en
  quatre gros boutons en bas — *au doigt, huit boutons ne tiennent pas*.
  **Trois au plus dans la file** (Magicka : cinq). Les orbes de la file
  s'affichent en bas avec le nom du sort qu'elle lancerait, et tournent
  autour du magicien.
- **Les opposés s'annulent en entrant** : le feu efface un froid de la file
  (et inversement), la foudre une terre. Un ✕ vide la file.
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
- **Quatre ennemis**, chacun sa vague d'arrivée :

  | ennemi | dès la vague | PV | vitesse | coup sur la tour | faiblesse |
  |---|---|---|---|---|---|
  | Gobelin | 1 | 10 | 7 | 1 | — |
  | Orc | 2 | 30 | 4,5 | 3 | — |
  | Esprit de feu | 3 | 14 | 6,5 | 2 | insensible au feu, le froid double |
  | Golem | 4 | 40 | 3,5 | 4 | la foudre ×0,25, le feu ×0,5, la terre double |

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

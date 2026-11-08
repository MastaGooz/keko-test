# Néon — `?neon`, un side project

Keko (08/11), après la tour du magicien : « un nouveau proto test : un jeu
arcade incrémental/roguelike. À base de formes géométriques néon flashy sur
un fond sombre. On contrôle un cercle en bas de l'écran : il ne bouge pas,
les ennemis viennent du haut. Et on joue à base de commandes action. Quand un
ennemi nous touche (ou un projectile), on peut tap pour parer. »

## Les fichiers

- `src/logic/neon/jeu.ts` — pur et seedé : le cercle, le tir automatique, les
  trois formes, les petits hexagones, la parade et sa fenêtre, l'onde, les
  niveaux et les améliorations. Le temps est injecté (en secondes), l'état
  modifié en place ; le monde a le cercle à l'origine, y vers le bas ; la page
  dit ce qu'elle montre (`Vue`). Vérifié par `jeu.verif.ts` (dans
  `npm run verif`), qui mesure aussi trois robots.
- `src/ui/neon/page.ts` + `neon.css` — le canvas néon (un halo additif, un
  trait de couleur, un cœur blanc par forme), la grille qui défile, l'anneau
  de garde, les effets ; en DOM les PV, le niveau, les abattus, les
  cartes d'un niveau, l'accueil et la fin. Classes préfixées `neon-`.
  `sons.ts` : les sons, sur la mécanique de ceux des envahisseurs.

## Les décisions (de moi, à rejuger par Keko)

- **Le cercle tire tout seul** sur l'ennemi le plus proche (un tir de 1
  toutes les 0,5 s, vitesse 80) : c'est la part incrémentale, les chiffres
  montent avec les améliorations. Le joueur n'a qu'un geste : LA PARADE.
- **LA PARADE, la commande action** : une tape n'importe où (au clavier, la
  barre d'espace). Elle pare la chose la plus pressante dans sa fenêtre :
  **220 ms avant le contact à 60 ms après** (la chose touchée reste collée
  au cercle pendant ces 60 ms, le coup ne tombe qu'ensuite) ; **80 ms avant à
  30 ms après, elle est PARFAITE**. Les règles jugent à l'instant du doigt :
  la page passe le retard entre la tape et son traitement (`retard`,
  `ev.timeStamp`), borné à 100 ms. **Une tape dans le vide bloque la parade
  0,3 s** (« Raté », l'anneau rougit et se pointille) : on ne pare pas en
  tapotant — la règle de la garde de la commande action.
- **Ce que fait la parade** : un ennemi paré encaisse 5, recule (40 unités/s
  qui s'amortissent sur 0,6 s) et reste étourdi ce temps-là ; un petit hexagone paré
  **repart sur son tireur** (qui a dérivé depuis — un premier essai le
  renvoyait tout droit, et il manquait), 1,4 fois plus vite, avec les dégâts
  de la parade. **Parfaite : ×3, et une ONDE DE CHOC** (rayon 18, 3 dégâts,
  recul 25) qui frappe tout autour du cercle et balaie les petits hexagones ; le temps
  ralentit à 25 % pendant 0,22 s. *Le losange renvoyé par une parfaite
  traversait tout ce qu'il croisait ; Keko (08/11) : « on va enlever le renvoi
  de losange perçant de la parade parfaite » — il s'arrête au premier touché,
  parfait ou non.* *Un COMBO de parades (+10 % aux dégâts de
  parade par parade d'affilée, cassé par un coup, affiché au-dessus du
  cercle) a vécu une heure : Keko, 08/11, « pas mal mais enlève le système
  de combo de parade pour l'instant » — parti des règles, de l'écran et de
  la fin de partie ; `git log` le garde.*
- **L'anneau de garde** autour du cercle est le repère : éteint, il s'allume
  en blanc quand quelque chose est dans la fenêtre, en or dans la fenêtre
  parfaite ; la chose elle-même se cercle de la même couleur. Rien d'autre
  que le mouvement et cet anneau, comme dans Paper Mario.
- **Trois formes**, chacune sa couleur et son rôle :

  | forme | dès | PV | vitesse | coup | rôle |
  |---|---|---|---|---|---|
  | Triangle (magenta) | 0 s | 3 | 14 | 1 | fonce droit, la chair à parade |
  | Hexagone (violet) | 20 s | 6 | 9 | — | s'arrête à 55 du cercle, respire 0,9 s, dérive de côté, tire un petit hexagone (vitesse 34, 1 dégât) toutes les 1,8 s ; son cœur jaune s'allume la demi-seconde d'avant |
  | Carré (orange) | 35 s | 9 | 7 | 2 | lent et dur : une parade ne le tue pas, il revient |

  Les ronds du cercle ignorent les petits hexagones : **ceux-là, il faut
  les parer**. Un ennemi qui touche sans être paré éclate sur le cercle (il lui
  coûte son coup) ; un petit hexagone aussi.
- **Les naissances** : une toutes les 1,5 s au départ (±30 %), jusqu'à une
  toutes les 0,4 s au bout de 3 min ; les PV ×(1 + 1,2 par minute), la
  vitesse ×(1 + 0,12 par minute), plafonnée à ×1,8.
- **Les niveaux** : l'expérience des abattus (3, 6, 8) ; 12 pour le premier
  niveau, ×1,35 ensuite. Un niveau arrête le jeu et offre **trois
  améliorations** parmi neuf (sans doublon, celles au bout exclues) : Cadence
  (+25 %, 6 rangs), Puissance (+1 par tir, 8), Salve (un tir de plus, 3),
  Perçant (traverse un ennemi de plus, 3), Garde large (fenêtres +30 %, 4),
  Riposte (la parade +4, 6), Onde de choc (rayon +6, dégâts +3, 4), Carapace
  (+1 PV max et 1 rendu, 5), Lenteur (ennemis −10 %, 4). Au clavier, 1 à 3.
  **Le choix attend un moment calme** (Keko, 08/11 : « le choix instantané
  me tue parfois car il casse le rythme et je foire ma parade en cours ») :
  le niveau est gagné tout de suite (« NIV 3 ▲ » en haut), mais les cartes
  ne s'ouvrent que quand rien n'est à moins de 0,8 s du contact
  (`prochainContact`, `choixPossible`) ; passé 6 s sans calme, dès que rien
  n'est dans la fenêtre de parade — jamais au milieu d'une parade possible.
  Après le choix, le jeu repart 0,6 s à 30 % de vitesse (`REPRISE`), le
  temps de reprendre le rythme. *La première version ouvrait les cartes à
  l'instant même.*
- **Le cercle a 5 PV**, des traits néon en haut à gauche. Le record est le
  nombre d'abattus (`keko-neon-record`).
- **L'écran** montre 80 unités de large et au moins 130 de haut (sur un PC
  large, le terrain se resserre au milieu) ; le cercle est à 16 unités du bas.
- **Mesuré** par un robot qui pare dès que la fenêtre s'ouvre (et prend
  toujours la première amélioration) : sans parer, le cercle s'éteint à 38 s,
  niveau 3 ; en parant, il tient les 10 min de la mesure (niveau 18, ~1 200
  abattus) — un robot ne rate jamais. C'est le
  joueur qui dira si la montée est trop lente.
- **L'IDENTITÉ DES FORMES** (Keko, 08/11 : « il faudrait donner une
  identité aux formes : déjà une forme ne devrait pas en tirer une autre. Le
  rond tire des ronds, etc. ») : le cercle tire des RONDS (des traits cyan
  avant) ; l'hexagone tire de PETITS HEXAGONES violets qui tournent (des
  losanges jaunes avant) — renvoyés par une parade, ils passent à l'or ; le
  triangle POINTE vers le cercle au lieu de tournoyer (sa pointe est sa
  course) ; le carré BASCULE d'un quart de tour à la fois, lourd ;
  l'hexagone tourne doucement sur lui-même. Les règles ne changent pas.
- *Le cœur jaune de l'hexagone grossissait sans fin pendant sa descente*
  (Keko, 08/11 : « les ennemis violets grossissent dans une forme jaune
  pleine ») : la part « bientôt » n'était pas bornée alors que, avant la
  halte, le prochain tir est déjà « passé ». Bornée à 1 ; et l'hexagone
  respire une demi-cadence en arrivant, son cœur s'allume, on le voit venir.
- **Pas encore** : la part incrémentale entre les parties (des éclats gardés,
  un atelier d'améliorations permanentes) ; d'autres commandes action que la
  parade (un rechargement actif du tir, une charge) ; un boss. À trancher par
  Keko.

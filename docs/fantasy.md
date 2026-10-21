# Le gacha fantasy — concept et décisions

*Mise à jour du concept donnée par Keko le 21 octobre 2026. Le jeu migre des emoji
vers un gacha idle + TCG en fantasy ; le moteur reste celui de la collection
d'emoji (boosters, sachet, défilé, collection, stickers, deck qui joue).*

## Le concept (texte de Keko, 21/10/2026)

Thème : fantasy.

Boucle de base : ouvrir des boosters → les cartes vont dans des decks qui jouent
seuls → les decks génèrent des ressources → les ressources achètent de nouveaux
boosters.

**Les lieux (décidé).** Chaque deck est assigné à un lieu et y joue en
automatique. Un deck fait toujours 30 cartes, quel que soit le lieu. Chaque lieu
a une jauge : le deck doit générer X ressources pour déclencher une récompense,
donc plus le deck est puissant, plus les récompenses tombent vite. De nouveaux
lieux se débloquent au fil de la partie, plus exigeants, et peuvent donner des
ressources de tiers différents.

Pistes pour les lieux (à valider) : chaque lieu a des règles propres (bonus pour
certains tags, lieux de combat où la jauge résiste), pour que chaque lieu demande
un deck différent. Une carte ne pouvant être que dans un seul deck, le joueur
doit répartir sa collection. Les lieux s'améliorent via des achats directs (ex.
une Taverne : +1 carte en main) plutôt que via des cartes.

**Ressource générée (recommandé, pas tranché)** : une seule ressource produite
par les cartes, la puissance, que chaque lieu convertit en sa propre récompense.

**Les cartes.** Le type central est la Créature : elle produit de la puissance
et porte deux tags, une race et un rôle. Les tags sont le langage du jeu, ils
servent aux synergies, aux bonus des lieux et à l'album. Les sorts ne sont pas
des cartes : s'il y a du jeu actif, ce sont des pouvoirs débloqués par la
progression, hors boosters.

**Stickers (décidé).** Détruire une carte donne son illustration sous forme de
sticker.

**Collage des stickers (idée en développement, non établie).** Coller un sticker
sur une autre carte. Règles envisagées : sticker consommé, non déplaçable,
détruit si la carte porteuse est détruite. Piste : le sticker transfère le tag
de la carte d'origine pour créer des cartes à double tag.

**Album (décidé dans le principe).** Les stickers peuvent remplir un album, et
compléter une famille donne un bonus. Si le collage est retenu, il crée un
arbitrage : compléter l'album ou renforcer une carte. Pistes : pages par race ou
par rôle avec bonus liés, paliers de complétion, pages qui débloquent du
contenu, album conservé au prestige.

Prévu mais pas encore travaillé : fusion, combat, prestige.

## Le pool de cartes — décisions et propositions (20–21/10/2026)

- **Uniquement des personnages** (type « Créature » du concept), pas de cartes
  objet, sort ou lieu. Les lieux sont des niveaux, les objets des ressources.
- **Deux tags par carte, race et rôle.** Races : gobelin, orc, humain, elfe,
  nain, mort-vivant (pour commencer). Rôles : mêlée, distance, magie, soutien
  (« soutien » choisi par Keko pour tout ce qui n'est pas du combat : peon,
  artisan, messager, mais aussi prêtre, barde).
- **La classe n'est pas un tag** : c'est l'identité de la carte (nom + ce
  qu'elle tient à l'image). « Archère elfe » = classe + race. Aucune règle ne lit
  la classe ; les synergies parlent de races et de rôles. La rareté est portée
  par la classe.
- **Taille du pool** : repères donnés — Hearthstone ~380 à la sortie, Magic
  295, Marvel Snap ~200, Pokémon TCG Pocket ~290. Proposition : **384**, soit
  64 par race (l'unité d'une extension : une race = 64 cartes). Keko trouve
  240 trop peu ; il veut partir du nombre total.
- **La répartition n'a pas à être symétrique** (Keko). Proposition de profils,
  en cartes par case, 64 par race, colonnes proches :

  | | mêlée | distance | magie | soutien |
  |---|---|---|---|---|
  | Gobelin | 10 | 20 | 12 | 22 |
  | Orc | 28 | 10 | 8 | 18 |
  | Humain | 16 | 16 | 16 | 16 |
  | Elfe | 10 | 24 | 20 | 10 |
  | Nain | 24 | 10 | 8 | 22 |
  | Mort-vivant | 16 | 8 | 28 | 12 |

  Les cases faibles (berserker elfe, archimage orc) sont rares par nature.
- **Contrainte venue du concept** : une carte n'est que dans un seul deck et un
  deck fait 30 cartes ; avec N lieux ouverts il faut 30 × N cartes distinctes.
  384 cartes soutiennent une dizaine de lieux avec du choix.

## Les illustrations — le banc de génération

- Style retravaillé par Keko le 20/10/2026 : 53 planches 2 × 2 générées, 204
  images découpées (`C:\Users\kcast\Desktop\Style\`, `images\` sur blanc pour
  l'entraînement, `images-alpha\` en transparent pour les assets, `tri\` par
  catégorie). Aplats, ombres franches, personnages trapus de quatre têtes,
  visages adultes.
- **LoRA v3** (`C:\Users\kcast\sdxl\sorties\kekostyle3.safetensors`, déclencheur
  « kksty ») entraîné le 20/10 au soir sur 58 images (34 personnages et
  créatures, 14 capacités, 4 objets, 6 lieux), 8 époques, 1 856 pas, 57 min.
  Les proportions chibi ont disparu. Époque 8 retenue.
- **Réglage de génération** : DPM++ Karras 40 pas, CFG 7, consignes qui disent
  où est l'objet et dans quelle main, négatif « floating objects, duplicate
  objects, extra hands ». Environ une image sur deux est bonne : **quatre
  graines par carte puis tri**, le compteur de morceaux détachés élimine les
  ratés d'office. Le fond sort à 241, pas 255 ; sans conséquence pour le
  découpage en sticker.
- **Chaleur** : le portable plafonne à 87–89 °C en charge continue et s'est figé
  une nuit (20/10, 6 h 06). Génération et entraînement de jour, sonde
  `nvidia-smi` toutes les 10 s, pas de nuit tant que le refroidissement n'est
  pas réglé. Une carte = 4 graines × 23 s ≈ 1 min 30 ; 384 cartes ≈ 10 h.

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
  la classe ; les synergies parlent de races et de rôles.
- **Une carte par couple classe × race**, et **le sexe est tiré au hasard
  pour chaque carte** (seedé) : pas de pyromancien gobelin homme ET femme
  (Keko). Le nom s'accorde au sexe tiré (Roi / Reine, Archer / Archère).
- **La rareté est propre à chaque carte**, indépendante de la race, du rôle et
  de la classe (Keko). **500 cartes au plus.**
- **La répartition n'a pas à être symétrique** (Keko) : chaque peuple a son
  fort — orcs et nains la mêlée, elfes la distance, morts-vivants la magie,
  gobelins le soutien, humains équilibrés.
- **Une septième race, Bête** (Keko) : ses « classes » sont des espèces
  (dragon, loup…), **jamais une race civilisée** — ni homme-lézard, ni
  homme-oiseau, ni troll, ni ogre.
- **LE POOL VALIDÉ (21/10/2026) : 393 cartes, 165 classes + 49 espèces** —
  « très honnête en quantité pour un gacha collection idle » (Keko). Une
  centaine de places restent sous les 500 pour ouvrir des classes à d'autres
  races.

  | | mêlée | distance | magie | soutien | total |
  |---|---|---|---|---|---|
  | Gobelin | 10 | 18 | 13 | 20 | 61 |
  | Orc | 21 | 10 | 10 | 14 | 55 |
  | Humain | 14 | 13 | 16 | 18 | 61 |
  | Elfe | 9 | 17 | 18 | 12 | 56 |
  | Nain | 19 | 9 | 9 | 19 | 56 |
  | Mort-vivant | 13 | 7 | 22 | 13 | 55 |
  | Bête | 14 | 11 | 12 | 12 | 49 |
  | **total** | 100 | 85 | 100 | 108 | **393** |

### Les classes par race

**Gobelin (61)**
- Mêlée : Garde, Guerrier, Bagarreur, Chef de guerre, Brute, Coupe-jarret,
  Sapeur, Escrimeur à l'ombrelle, Chevaucheur de rat, Péagier
- Distance : Archer, Chasseur, Arbalétrier, Lanceur de couteaux, Éclaireur,
  Canonnier, Tireur à la sarbacane, Fauconnier, Frondeur, Lanceur de bombes,
  Pétardier, Poseur de pièges, Lanceur de ruches, Cerf-voliste, Aéronaute,
  Lanceur de boomerang, Rétiaire, Artificier
- Magie : Pyromancien, Apprenti, Illusionniste, Sorcier, Électromancien,
  Chaman, Alchimiste, Ritualiste, Cartomancien, Mycomancien, Essaimancien,
  Mage de rouille, Mangeur de feu
- Soutien : Fermier, Cuisinier, Mineur, Bûcheron, Messager, Marchand,
  Herboriste, Ferrailleur, Dompteur de bêtes, Porteur, Bricoleur, Ingénieur,
  Contrebandier, Prêteur sur gages, Apiculteur, Taxidermiste, Ramoneur,
  Chiffonnier, Champignonniste, Horloger

**Orc (55)**
- Mêlée : Garde, Guerrier, Lancier, Bagarreur, Chef de guerre, Maître
  d'armes, Champion, Gladiateur, Brute, Berserker, Brise-bouclier, Marteleur,
  Briseur de crânes, Écorcheur, Massacreur, Ravageur, Chevaucheur de loup,
  Bourreau, Lutteur d'ours, Péagier, Fléautier
- Distance : Archer, Chasseur, Lanceur de couteaux, Javelinier, Pisteur,
  Lanceur de harpon, Lanceur de ruches, Catapultier, Lanceur de bolas,
  Lanceur de boomerang
- Magie : Pyromancien, Druide, Chaman, Géomancien, Sorcier du sang,
  Haruspice, Chanteur de pierre, Tatoueur runique, Mangeur de feu, Mage de
  cendre
- Soutien : Roi, Fermier, Cuisinier, Mineur, Bûcheron, Forgeron, Guérisseur,
  Ferrailleur, Dompteur de bêtes, Porteur, Porte-étendard, Tambour de guerre,
  Conteur, Montreur d'ours

**Humain (61)**
- Mêlée : Garde, Guerrier, Lancier, Bagarreur, Maître d'armes, Duelliste,
  Hallebardier, Gladiateur, Paladin, Chevalier, Faucheur, Bourreau, Moine
  bâtonniste, Fléautier
- Distance : Archer, Chasseur, Arbalétrier, Lanceur de couteaux, Éclaireur,
  Tireur d'élite, Arquebusier, Rôdeur, Maître archer, Cerf-voliste,
  Catapultier, Lanceur de bolas, Rétiaire
- Magie : Pyromancien, Apprenti, Cryomancien, Invocateur, Archimage,
  Illusionniste, Sorcier, Chronomancien, Astromancien, Nécromancien,
  Cartomancien, Calligraphe, Mage des miroirs, Mangeur de feu, Mage des
  marées, Mage du sel
- Soutien : Roi, Fermier, Cuisinier, Bûcheron, Messager, Forgeron, Marchand,
  Pêcheur, Barde, Prêtre, Cartographe, Apiculteur, Fromager, Conteur,
  Souffleur de verre, Ramoneur, Gardien de phare, Montreur d'ours

**Elfe (56)**
- Mêlée : Garde, Guerrier, Lancier, Champion, Duelliste, Lame-dansante, Moine
  bâtonniste, Escrimeur à l'ombrelle, Cavalier de cerf
- Distance : Archer, Chasseur, Éclaireur, Tireur d'élite, Javelinier,
  Pisteur, Rôdeur, Maître archer, Tireur à la sarbacane, Fauconnier, Archer
  sylvestre, Archer lunaire, Sentinelle, Lanceur de glaives, Chasseur de
  dragons, Semeur d'épines, Lanceur de lucioles
- Magie : Pyromancien, Apprenti, Cryomancien, Invocateur, Archimage,
  Illusionniste, Chronomancien, Électromancien, Druide, Astromancien,
  Ombremancien, Enchanteur, Oracle, Calligraphe, Onironaute, Mage des
  miroirs, Essaimancien, Mage des marées
- Soutien : Roi, Messager, Pêcheur, Barde, Herboriste, Guérisseur,
  Cartographe, Apiculteur, Conteur, Souffleur de verre, Tisseur de linceuls,
  Archiviste

**Nain (56)**
- Mêlée : Garde, Guerrier, Lancier, Bagarreur, Chef de guerre, Maître
  d'armes, Champion, Hallebardier, Berserker, Brise-bouclier, Marteleur,
  Briseur de crânes, Paladin, Gardien du roc, Tueur de géants, Sapeur,
  Porte-enclume, Lutteur d'ours, Fléautier
- Distance : Chasseur, Arbalétrier, Tireur d'élite, Canonnier, Arquebusier,
  Lanceur de haches, Aéronaute, Catapultier, Artificier
- Magie : Pyromancien, Alchimiste, Géomancien, Maître des runes, Enchanteur
  de runes, Mycomancien, Chanteur de pierre, Tatoueur runique, Mage du sel
- Soutien : Roi, Fermier, Cuisinier, Mineur, Bûcheron, Forgeron, Marchand,
  Prêtre, Bricoleur, Ingénieur, Porte-étendard, Brasseur, Tailleur de pierre,
  Orfèvre, Cartographe, Fromager, Gardien de phare, Champignonniste, Horloger

**Mort-vivant (55)**
- Mêlée : Garde, Guerrier, Lancier, Duelliste, Hallebardier, Écorcheur,
  Chevalier, Goule, Revenant, Momie, Faucheur, Bourreau, Sonneur de glas
- Distance : Archer, Archer spectral, Lanceur d'os, Cracheur de peste,
  Arbalétrier maudit, Rétiaire, Corbeautier
- Magie : Pyromancien, Apprenti, Cryomancien, Invocateur, Archimage, Sorcier,
  Chronomancien, Ombremancien, Nécromancien, Sorcier du sang, Ritualiste,
  Liche, Banshee, Embaumeur, Maître des âmes, Mage de peste, Marionnettiste
  d'os, Onironaute, Mycomancien, Haruspice, Mage de rouille, Mage de cendre
- Soutien : Roi, Fermier, Cuisinier, Mineur, Messager, Fossoyeur,
  Porte-lanterne, Passeur, Taxidermiste, Chiffonnier, Tisseur de linceuls,
  Archiviste, Pleureur

**Bête (49 espèces)**
- Mêlée : Loup, Ours, Sanglier, Taureau, Tigre à dents de sabre, Mammouth,
  Rhinocéros cuirassé, Crocodile, Araignée géante, Scorpion géant, Ver des
  sables, Griffon, Mantichore, Hydre
- Distance : Dragon, Wyverne, Roc, Chauve-souris géante, Frelon géant,
  Porc-épic géant, Cobra cracheur, Crapaud cracheur, Scarabée bombardier,
  Pieuvre géante, Anguille électrique
- Magie : Phénix, Licorne, Basilic, Chimère, Salamandre, Renard à neuf
  queues, Cerf blanc, Papillon de lune, Hibou des arcanes, Méduse céleste,
  Serpent de mer, Chat noir
- Soutien : Cheval, Pégase, Âne, Bœuf, Chèvre, Chien de berger, Cochon
  truffier, Corbeau, Pigeon voyageur, Tortue géante, Reine des abeilles,
  Escargot géant

- **Contrainte venue du concept** : une carte n'est que dans un seul deck et un
  deck fait 30 cartes ; avec N lieux ouverts il faut 30 × N cartes distinctes.
  393 cartes soutiennent une dizaine de lieux avec du choix.

## Les paquets et la rareté (21/10/2026)

- **Plus la rareté monte, plus on va vers le personnage unique et nommé** ;
  plus elle descend, plus on va vers le générique (Loup, Guerrier orc). Keko.
- **Répartition du pool VALIDÉE** (Keko) : 40 / 25 / 18 / 11 / 6 %, soit
  157 communes, 98 peu communes, 71 rares, 43 épiques, 24 légendaires —
  entre Magic (39/31/23/8, pyramide) et Hearthstone (35/26/20/17, pool plat) :
  une base générique large pour les decks de 30, une vitrine de ~3 héros
  nommés par peuple.
- **Rythme : 1 paquet par heure, 10 au plus en réserve** (24 par jour au
  maximum, 15–20 pour un joueur qui passe matin et soir) **+ une boutique de
  4 paquets renouvelée une fois par jour**, achetés avec les ressources. Le
  prix en temps de production est une proposition, pas tranché.
- **La dernière carte du paquet est au moins peu commune et porte la pitié**
  (Keko). Chiffres de la pitié et des taux pas encore tranchés.
- **Simulation** (393 cartes, 157/98/71/43/24 par cran, 5 cartes par paquet) :
  avec 20 à 28 paquets par jour, la moitié de la collection vient en 2–3 jours
  QUELS QUE SOIENT LES TAUX ; seuls l'épique et le légendaire font durer. Aux
  taux de l'emoji (Hearthstone), toutes les légendaires en 1,5–2,5 mois ; aux
  taux proposés (cartes 1–4 : 74/16/8/1,7/0,3 ; carte 5 : —/72/20/6,5/1,5 ;
  épique garantie au 10e paquet, légendaire au 60e), 2,5–4 mois.
- **Doublons** : à trancher (proposition : ils font monter la carte en niveau).

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
  pas réglé. Une carte = 4 graines × 23 s ≈ 1 min 30 ; 393 cartes ≈ 10 h.

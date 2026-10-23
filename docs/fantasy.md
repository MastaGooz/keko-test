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
  races. **394 depuis le 22/10** : la Gardienne des clés, un extra dessiné
  par Keko, entre en épique gobeline (44 épiques au lieu de 43). **395** :
  Grisette la Dorée, un bonus dessiné par Keko, devient la 4ᵉ légendaire
  gobeline (25 légendaires au lieu de 24).

  | | mêlée | distance | magie | soutien | total |
  |---|---|---|---|---|---|
  | Gobelin | 11 | 18 | 14 | 20 | 63 |
  | Orc | 21 | 10 | 10 | 14 | 55 |
  | Humain | 14 | 13 | 16 | 18 | 61 |
  | Elfe | 9 | 17 | 18 | 12 | 56 |
  | Nain | 19 | 9 | 9 | 19 | 56 |
  | Mort-vivant | 13 | 7 | 22 | 13 | 55 |
  | Bête | 14 | 11 | 12 | 12 | 49 |
  | **total** | 101 | 85 | 101 | 108 | **395** |

### Les classes par race

**Gobelin (63)**
- Mêlée : Garde, Guerrier, Bagarreur, Chef de guerre, Brute, Coupe-jarret,
  Sapeur, Escrimeur à l'ombrelle, Chevaucheur de rat, Péagier, Reine des
  voleurs
- Distance : Archer, Chasseur, Arbalétrier, Lanceur de couteaux, Éclaireur,
  Canonnier, Tireur à la sarbacane, Fauconnier, Frondeur, Lanceur de bombes,
  Pétardier, Poseur de pièges, Lanceur de ruches, Cerf-voliste, Aéronaute,
  Lanceur de boomerang, Rétiaire, Artificier
- Magie : Pyromancien, Apprenti, Illusionniste, Sorcier, Électromancien,
  Chaman, Alchimiste, Ritualiste, Cartomancien, Mycomancien, Essaimancien,
  Mage de rouille, Mangeur de feu, Gardien des clés
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
  Lanceur de harpon, Lanceur de pierres, Catapultier, Lanceur de bolas,
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

### Les raretés par race (proposition, 21/10/2026)

Du générique (commune) au personnage unique et nommé (légendaire). Le sexe
d'un légendaire est fixé par son nom ; les autres le tirent au hasard.

**Gobelin**
- Légendaire (4) : Chef de guerre « Snik le Rusé », Chaman « Mère Gribouille
  », Ingénieur « Zabbo Boulon-Fou », Reine des voleurs « Grisette la Dorée »
- Épique (8) : Chevaucheur de rat, Cerf-voliste, Aéronaute, Artificier,
  Illusionniste, Électromancien, Essaimancien, Gardien des clés
- Rare (11) : Escrimeur à l'ombrelle, Canonnier, Fauconnier, Lanceur de
  ruches, Pyromancien, Mage de rouille, Cartomancien, Ritualiste, Mycomancien,
  Sorcier, Alchimiste
- Peu commune (15) : Brute, Coupe-jarret, Péagier, Arbalétrier, Lanceur de
  bombes, Poseur de pièges, Rétiaire, Apprenti, Mangeur de feu, Dompteur de
  bêtes, Prêteur sur gages, Taxidermiste, Ferrailleur, Horloger, Contrebandier
- Commune (25) : Garde, Guerrier, Bagarreur, Sapeur, Archer, Chasseur,
  Lanceur de couteaux, Éclaireur, Frondeur, Pétardier, Lanceur de boomerang,
  Tireur à la sarbacane, Fermier, Cuisinier, Mineur, Bûcheron, Messager,
  Marchand, Herboriste, Porteur, Bricoleur, Apiculteur, Ramoneur, Chiffonnier,
  Champignonniste
- *Reclassé à l'image le 22/10 (Keko), voir la fiche des communes.*

**Orc**
- Légendaire (3) : Roi « Grumbak le Borgne », Chevaucheur de loup « Ursha
  Croc-Rouge », Chaman « Ghor l'Ancien »
- Épique (6) : Chef de guerre, Champion, Berserker, Sorcier du sang, Tatoueur
  runique, Tambour de guerre
- Rare (10) : Gladiateur, Ravageur, Massacreur, Lutteur d'ours, Lanceur de
  harpon, Catapultier, Haruspice, Chanteur de pierre, Mage de cendre, Montreur
  d'ours
- Peu commune (14) : Maître d'armes, Brise-bouclier, Marteleur, Briseur de
  crânes, Écorcheur, Bourreau, Péagier, Javelinier, Pisteur, Lanceur de bolas,
  Druide, Géomancien, Mangeur de feu, Porte-étendard
- Commune (22) : Garde, Guerrier, Lancier, Bagarreur, Brute, Fléautier,
  Archer, Chasseur, Lanceur de couteaux, Lanceur de pierres, Lanceur de
  boomerang, Pyromancien, Fermier, Cuisinier, Mineur, Bûcheron, Forgeron,
  Guérisseur, Ferrailleur, Dompteur de bêtes, Porteur, Conteur

**Humain**
- Légendaire (4) : Roi « Aldric le Juste », Archimage « Méliane l'Étoilée »,
  Paladin « Sire Gaspard », Rôdeur « Corvin le Gris »
- Épique (7) : Chevalier, Maître d'armes, Maître archer, Chronomancien,
  Nécromancien, Invocateur, Prêtre
- Rare (11) : Faucheur, Moine bâtonniste, Gladiateur, Tireur d'élite, Cerf-
  voliste, Rétiaire, Astromancien, Calligraphe, Mage des miroirs, Mage des
  marées, Cartographe
- Peu commune (15) : Duelliste, Hallebardier, Bourreau, Fléautier,
  Arbalétrier, Arquebusier, Catapultier, Lanceur de bolas, Cryomancien,
  Illusionniste, Sorcier, Cartomancien, Mangeur de feu, Mage du sel, Barde
- Commune (24) : Garde, Guerrier, Lancier, Bagarreur, Archer, Chasseur,
  Lanceur de couteaux, Éclaireur, Pyromancien, Apprenti, Fermier, Cuisinier,
  Bûcheron, Messager, Forgeron, Marchand, Pêcheur, Apiculteur, Fromager,
  Conteur, Souffleur de verre, Ramoneur, Gardien de phare, Montreur d'ours

**Elfe**
- Légendaire (4) : Roi « la reine Ilyaëlle », Oracle « Ysmira », Lame-dansante
  « Faelis », Archer lunaire « Nyriel »
- Épique (6) : Champion, Maître archer, Chasseur de dragons, Archimage,
  Enchanteur, Cavalier de cerf
- Rare (10) : Escrimeur à l'ombrelle, Moine bâtonniste, Lanceur de glaives,
  Lanceur de lucioles, Sentinelle, Chronomancien, Astromancien, Ombremancien,
  Onironaute, Mage des miroirs
- Peu commune (14) : Duelliste, Tireur d'élite, Rôdeur, Tireur à la sarbacane,
  Fauconnier, Semeur d'épines, Archer sylvestre, Cryomancien, Invocateur,
  Illusionniste, Électromancien, Druide, Calligraphe, Barde
- Commune (22) : Garde, Guerrier, Lancier, Archer, Chasseur, Éclaireur,
  Javelinier, Pisteur, Pyromancien, Apprenti, Essaimancien, Mage des marées,
  Messager, Pêcheur, Herboriste, Guérisseur, Cartographe, Apiculteur, Conteur,
  Souffleur de verre, Tisseur de linceuls, Archiviste

**Nain**
- Légendaire (4) : Roi « Durgan Barbe-d'Enclume », Maître des runes « Hilda
  Chant-de-Rune », Tueur de géants « Gorrin Brise-Montagne », Forgeron « Ulfa
  la Forgeronne »
- Épique (6) : Chef de guerre, Champion, Gardien du roc, Paladin, Enchanteur
  de runes, Porte-enclume
- Rare (10) : Berserker, Lutteur d'ours, Canonnier, Aéronaute, Artificier,
  Lanceur de haches, Chanteur de pierre, Tatoueur runique, Orfèvre, Gardien de
  phare
- Peu commune (14) : Maître d'armes, Hallebardier, Brise-bouclier, Marteleur,
  Briseur de crânes, Sapeur, Arquebusier, Tireur d'élite, Catapultier,
  Alchimiste, Géomancien, Mycomancien, Porte-étendard, Ingénieur
- Commune (22) : Garde, Guerrier, Lancier, Bagarreur, Fléautier, Chasseur,
  Arbalétrier, Pyromancien, Mage du sel, Fermier, Cuisinier, Mineur, Bûcheron,
  Marchand, Prêtre, Bricoleur, Brasseur, Tailleur de pierre, Cartographe,
  Fromager, Champignonniste, Horloger

**Mort-vivant**
- Légendaire (3) : Liche « Morvath », Roi « Ossiran, le Roi-Spectre », Banshee
  « Ondine la Pleureuse »
- Épique (6) : Chevalier, Revenant, Maître des âmes, Nécromancien, Archimage,
  Sonneur de glas
- Rare (10) : Faucheur, Momie, Archer spectral, Arbalétrier maudit,
  Corbeautier, Chronomancien, Embaumeur, Marionnettiste d'os, Onironaute,
  Passeur
- Peu commune (14) : Duelliste, Hallebardier, Écorcheur, Bourreau, Goule,
  Cracheur de peste, Rétiaire, Invocateur, Sorcier du sang, Ombremancien, Mage
  de peste, Haruspice, Porte-lanterne, Pleureur
- Commune (22) : Garde, Guerrier, Lancier, Archer, Lanceur d'os, Pyromancien,
  Apprenti, Cryomancien, Sorcier, Ritualiste, Mycomancien, Mage de rouille,
  Mage de cendre, Fermier, Cuisinier, Mineur, Messager, Fossoyeur,
  Taxidermiste, Chiffonnier, Tisseur de linceuls, Archiviste

**Bête**
- Légendaire (3) : Dragon « Pyrargos », Phénix « Aurore », Hydre « l'Hydre de
  Morne-Marais »
- Épique (5) : Griffon, Mantichore, Licorne, Chimère, Roc
- Rare (9) : Wyverne, Basilic, Ver des sables, Mammouth, Renard à neuf queues,
  Serpent de mer, Méduse céleste, Pégase, Tigre à dents de sabre
- Peu commune (12) : Ours, Rhinocéros cuirassé, Araignée géante, Scorpion
  géant, Crocodile, Frelon géant, Pieuvre géante, Anguille électrique,
  Salamandre, Cerf blanc, Papillon de lune, Hibou des arcanes
- Commune (20) : Loup, Sanglier, Taureau, Chauve-souris géante, Porc-épic
  géant, Cobra cracheur, Crapaud cracheur, Scarabée bombardier, Chat noir,
  Cheval, Âne, Bœuf, Chèvre, Chien de berger, Cochon truffier, Corbeau, Pigeon
  voyageur, Tortue géante, Reine des abeilles, Escargot géant

- **Contrainte venue du concept** : une carte n'est que dans un seul deck et un
  deck fait 30 cartes ; avec N lieux ouverts il faut 30 × N cartes distinctes.
  393 cartes soutiennent une dizaine de lieux avec du choix.

### Un nom par carte : les classes partagées renommées (22/10/2026)

- **Keko** : « on va se retrouver avec des noms de race dans quasi toutes les cartes… on peut pas renommer les classes qui sont en plusieurs exemplaires mais race différente en prenant des synonymes ». Et : « pas grave si ça s'accorde pas au féminin ».
- **112 classes partagées, 290 des 344 cartes de peuples** : 173 renommées (le Lanceur de ruches orc, remplacé le 22/10 par le Lanceur de pierres, n'est plus partagé). Le **gobelin garde le nom simple** partout où il a la classe (ses communes sont déjà dessinées) ; sinon, la race où le métier sonne le plus juste. **Les légendaires gardent leur classe** : leur nom propre les distingue (Roi ×5, Chaman ×2 sont les seuls doublons restants, tous légendaires).
- Des noms **colorés par la race** plutôt que des synonymes purs, vérifiés par script : aucun ne revient deux fois, aucun ne reprend une classe existante. Proposition, à rejuger nom par nom.

**Orc** (33)
- Mêlée : Garde → Cogneur de porte, Guerrier → Fracasseur, Lancier → Embrocheur, Bagarreur → Cogne-poing, Chef de guerre → Seigneur de horde, Maître d'armes → Maître de la fosse, Gladiateur → Combattant de l'arène, Brute → Mastodonte, Marteleur → Masse-d'os, Bourreau → Coupeur de têtes, Péagier → Rançonneur, Fléautier → Batteur de chaîne
- Distance : Archer → Archer de la horde, Chasseur → Traqueur, Lanceur de couteaux → Lanceur de hachettes, Catapultier → Lanceur de rochers, Lanceur de boomerang → Lance-mâchoire
- Magie : Pyromancien → Cracheur de braise, Druide → Sage des ronces, Géomancien → Fendeur de terre, Chanteur de pierre → Chantre des roches, Mangeur de feu → Avaleur de braises
- Soutien : Fermier → Éleveur de cochons, Cuisinier → Rôtisseur, Mineur → Creuse-roc, Bûcheron → Abatteur d'arbres, Forgeron → Batteur de fer, Guérisseur → Rebouteux, Ferrailleur → Pilleur d'épaves, Dompteur de bêtes → Dresseur de wargs, Porteur → Bête de somme, Conteur → Hurleur de légendes, Montreur d'ours → Meneur d'ours

**Humain** (30)
- Mêlée : Garde → Homme de guet, Guerrier → Homme d'armes, Bagarreur → Pugiliste, Faucheur → Moissonneur de guerre
- Distance : Archer → Archer royal, Chasseur → Veneur, Arbalétrier → Balestrier, Lanceur de couteaux → Jongleur de lames, Éclaireur → Coureur des bois, Maître archer → Capitaine des archers, Cerf-voliste → Pilote de cerf-volant, Lanceur de bolas → Lanceur de filins, Rétiaire → Gladiateur au filet
- Magie : Pyromancien → Mage du feu, Apprenti → Novice, Illusionniste → Prestidigitateur, Sorcier → Mage noir, Nécromancien → Profanateur de tombes, Cartomancien → Tireur de cartes, Mangeur de feu → Cracheur de feu, Mage du sel → Mage des salines
- Soutien : Fermier → Laboureur, Cuisinier → Aubergiste, Bûcheron → Forestier, Messager → Héraut, Forgeron → Maréchal-ferrant, Marchand → Colporteur, Apiculteur → Ruchier, Fromager → Laitier, Ramoneur → Fumiste

**Elfe** (39)
- Mêlée : Garde → Veilleur des bois, Guerrier → Lame d'argent, Lancier → Porte-lance sylvain, Champion → Élu de la forêt, Duelliste → Escrimeur des feuilles, Moine bâtonniste → Danseur au bâton, Escrimeur à l'ombrelle → Escrimeur à l'éventail
- Distance : Archer → Archer des cimes, Chasseur → Chasseur de l'aube, Éclaireur → Coureur des feuillages, Tireur d'élite → Œil-de-faucon, Javelinier → Lanceur de sagaies, Pisteur → Liseur de traces, Rôdeur → Errant des bois, Tireur à la sarbacane → Souffleur de dards, Fauconnier → Chanteur d'oiseaux
- Magie : Pyromancien → Danseur de flammes, Apprenti → Élève des sages, Cryomancien → Mage du givre, Invocateur → Appeleur d'esprits, Archimage → Haut mage, Illusionniste → Tisseur de mirages, Chronomancien → Gardien des saisons, Électromancien → Mage de l'orage, Astromancien → Lecteur d'étoiles, Ombremancien → Mage du crépuscule, Calligraphe → Scribe des feuilles, Mage des miroirs → Mage des reflets, Essaimancien → Mage des papillons, Mage des marées → Mage des sources
- Soutien : Messager → Coursier du vent, Pêcheur → Pêcheur des lacs, Barde → Ménestrel, Herboriste → Cueilleur de simples, Cartographe → Arpenteur, Apiculteur → Gardien des abeilles, Conteur → Chanteur de légendes, Souffleur de verre → Tailleur de cristal, Tisseur de linceuls → Tisserand de lune

**Nain** (40)
- Mêlée : Garde → Gardien de la porte, Guerrier → Fer-de-hache, Lancier → Pique-roc, Bagarreur → Cogneur de taverne, Chef de guerre → Thane, Maître d'armes → Maître d'acier, Champion → Héros du clan, Hallebardier → Piquier, Berserker → Enragé, Brise-bouclier → Fend-écu, Briseur de crânes → Casse-crâne, Paladin → Juré de l'enclume, Sapeur → Saboteur, Lutteur d'ours → Lutteur des montagnes, Fléautier → Fléau-de-fer
- Distance : Chasseur → Trappeur, Arbalétrier → Carreau-de-fer, Tireur d'élite → Œil-de-fer, Canonnier → Bombardier, Arquebusier → Mousquetaire, Aéronaute → Pilote de dirigeable, Catapultier → Servant de baliste, Artificier → Maître des poudres
- Magie : Pyromancien → Maître du brasier, Alchimiste → Distillateur, Mycomancien → Mage des cavernes, Tatoueur runique → Graveur de runes
- Soutien : Fermier → Éleveur de chèvres, Cuisinier → Maître des fourneaux, Mineur → Piocheur, Bûcheron → Fendeur de bûches, Marchand → Négociant, Prêtre → Chantre de l'enclume, Bricoleur → Mécanicien, Ingénieur → Maître des engrenages, Porte-étendard → Porte-bannière, Cartographe → Arpenteur des galeries, Gardien de phare → Veilleur de feu, Champignonniste → Jardinier des grottes, Horloger → Rouagier

**Mort-vivant** (31)
- Mêlée : Garde → Gardien des cryptes, Guerrier → Soldat squelette, Lancier → Pique-os, Duelliste → Escrimeur fantôme, Hallebardier → Veilleur de la nécropole, Écorcheur → Dépeceur, Chevalier → Cavalier sans tête, Bourreau → Exécuteur damné
- Distance : Archer → Tireur squelette, Rétiaire → Lanceur de chaînes
- Magie : Pyromancien → Mage des feux follets, Apprenti → Disciple de la tombe, Cryomancien → Mage de la glace morte, Invocateur → Éveilleur de morts, Archimage → Mage déchu, Sorcier → Sorcier des tombes, Chronomancien → Voleur d'années, Sorcier du sang → Buveur de sang, Ritualiste → Officiant des ténèbres, Onironaute → Mangeur de rêves, Mycomancien → Mage de la pourriture, Haruspice → Liseur d'entrailles, Mage de rouille → Mage de la corrosion, Mage de cendre → Mage du bûcher
- Soutien : Fermier → Jardinier des tombes, Cuisinier → Touilleur de chaudron, Mineur → Creuseur d'ossuaire, Messager → Messager d'outre-tombe, Taxidermiste → Empailleur, Chiffonnier → Ramasse-guenilles, Archiviste → Gardien des registres

### Le sexe de chaque carte, et la fiche des communes gobelins (proposition, 21/10/2026)

- **Keko** : « repartir un peu le sexe de manière plus cohérente qu'au hasard
  en gardant un ratio à peu près équilibré (40/60 pas plus en déséquilibre) ».
  Règle : **entre 40/60 et 60/40 par race et par cran**, chaque sexe choisi pour
  l'image de la carte et le contraste avec ses voisines. Le nom sur la carte
  s'accorde (Archère, Bagarreuse…).
- **Assoupli par Keko (22/10)** : « ratio sexe = doit être mixte (à peu
  près) en général (pas forcément à chaque rareté) ». La règle vaut **par
  race, toutes raretés confondues** ; un cran peut pencher d'un côté. Et
  « rareté = métier pas forcément » : **la rareté d'une carte peut se juger
  à son image** (complexité, effet, charisme), pas seulement au métier.
- **LE RECLASSEMENT À L'IMAGE (Keko, 22/10 : « go, applique le
  reclassement »)** : les 58 illustrations rejugées sur ce qu'elles montrent
  — plus une carte est rare, plus elle sort du « gobelin avec un objet » :
  un effet, un animal, puis une monture, une machine, une scène. Seize
  cartes ont bougé, les comptes par cran restent 25 / 15 / 11, les épiques
  passent à 8 avec l'extra :
  - commune → peu commune : Ferrailleuse, Apprentie ;
  - peu commune → commune : Tireur à la sarbacane, Sapeur (le jumeau du Mineur) ;
  - peu commune → rare : Pyromancienne, Mage de rouille (Keko, ensuite :
    « pyromancienne et mangeuse de feu au même niveau c'est dommage » — la
    Mangeuse de feu, montée d'abord, est restée peu commune) ;
  - rare → peu commune : Péagier, Rétiaire (trop sobres pour leur rang) ;
  - rare → épique : Illusionniste, Électromancienne, Essaimancienne ;
  - épique → rare : Cartomancienne ; Horloger et Contrebandière, passés
    par rare, finissent en peu commune (Keko : « alchimiste / sorcier /
    dompteur, ils ont l'air puissants pour des uncommon… alors que horloger,
    cartomancienne, contrebandière font un peu faible ») ;
  - peu commune → rare : Sorcier, Alchimiste (échangés contre eux) ; le
    Dompteur reste peu commune, son loup en laisse est la première marche
    de l'échelle des compagnons ;
  - l'extra entre en épique : la **Gardienne des clés** (« Porte-lanterne »
    et « Mage des feux follets » sont déjà pris chez les morts-vivants).

  Le gobelin entier : **30 hommes, 32 femmes**. Les fiches ci-dessous et les
  dossiers d'images suivent le nouveau rangement (renumérotés) ; l'ancien
  rangement est gardé hors du dépôt, dans le scratchpad de la session.
- **Communes gobelins : 14 hommes, 11 femmes (56/44).** Mêlée 3 H / 1 F,
  distance 5 H / 3 F, soutien 6 H / 7 F.
- **La fiche** (nom · sexe · arme ou outil et la main qui le tient · description),
  base des prompts de génération, traduite en anglais avec « kksty » au
  lancement d'un lot. Tous dans le style du LoRA : trapus, adultes, aplats.
  *À trancher : la fiche inverse l'Archer et la Chasseuse par rapport au
  tableau de répartition (tableau : Archère ♀, Chasseur ♂ ; fiche : Archer ♂,
  Chasseuse ♀). Le total reste 13/12 dans les deux cas.*

1. **Garde** · ♂ · une lance courte dans la main droite et un bouclier rond en bois cabossé dans la gauche. Trapu, casque de fer trop grand qui lui tombe sur les yeux, air bougon.
2. **Guerrier** · ♂ · une épée courte ébréchée dans la main droite. Armure de cuir rapiécée, épaulière en métal d'un seul côté, posture de combat.
3. **Bagarreuse** · ♀ · les poings nus bandés de tissu. Petite et teigneuse, oreille entaillée, sourire de défi, cheveux attachés en houppe.
4. **Sapeur** · ♂ · une pelle dans la main droite et un tonnelet de poudre sous le bras gauche. Casque de cuir avec une lampe, visage noirci, mèche roulée en bandoulière.
5. **Archer** · ♂ · un arc court dans la main gauche, une flèche encochée. Carquois dans le dos, capuche verte, plissant un œil pour viser.
6. **Chasseuse** · ♀ · une lance de chasse dans la main droite. Peau de loup sur les épaules, collier de dents, un lapin pendu à la ceinture.
7. **Lanceuse de couteaux** · ♀ · trois couteaux en éventail dans la main droite. Bandeau sur le front, ceinture couverte de lames, regard sournois.
8. **Éclaireuse** · ♀ · une longue-vue dans la main droite et une dague à la ceinture. Cape à capuche, pieds nus, accroupie en guet.
9. **Frondeur** · ♂ · une fronde qui tourne au-dessus de la tête dans la main droite, une pierre dans la gauche. Gamin des rues maigre, tunique trouée, langue tirée.
10. **Pétardier** · ♂ · un bâton de dynamite à mèche allumée dans la main droite. Sourcils roussis, lunettes de protection sur le front, cartouchière de pétards en travers du torse.
11. **Lanceur de boomerang** · ♂ · un boomerang en bois peint dans la main droite. Gros sourire édenté, peintures tribales sur les bras, en plein élan.
12. **Tireur à la sarbacane** · ♂ · une longue sarbacane en bambou portée à la bouche, à deux mains. Joues gonflées, plumes dans les cheveux, petites fléchettes à la ceinture.
13. **Fermier** · ♂ · une fourche sur l'épaule droite. Chapeau de paille, salopette rapiécée, un brin de paille au coin de la bouche.
14. **Cuisinière** · ♀ · une louche dans la main droite et une marmite fumante dans la gauche. Tablier taché, toque de travers, joues rondes.
15. **Mineur** · ♂ · une pioche dans la main droite. Casque avec une bougie, visage couvert de poussière, une pépite dans la poche.
16. **Bûcheron** · ♂ · une hache plus grande que lui, tenue à deux mains. Chemise à carreaux, bras noueux, copeaux de bois à ses pieds.
17. **Messagère** · ♀ · une lettre cachetée dans la main droite. Sacoche pleine de rouleaux en bandoulière, bottes usées, toujours en train de courir.
18. **Marchande** · ♀ · une bourse de pièces dans la main droite et une balance dans la gauche. Châle coloré, bagues à tous les doigts, sourire rusé.
19. **Herboriste** · ♀ · un mortier et son pilon tenus à deux mains. Bouquets d'herbes séchées accrochés à la ceinture, presque sorcière, foulard sur la tête.
20. **Porteur** · ♂ · une pile de sacs et de caisses sur le dos, tenue par des sangles. Très courbé, petites jambes arquées, sueur au front.
21. **Bricoleur** · ♂ · une clé à molette dans la main droite. Lunettes-loupes sur les yeux, poches pleines d'outils, un petit engrenage derrière l'oreille.
22. **Apicultrice** · ♀ · un enfumoir dans la main droite. Chapeau à voile, quelques abeilles autour d'elle, un pot de miel à la ceinture.
23. **Ramoneur** · ♂ · une brosse hérisson sur long manche, sur l'épaule. Couvert de suie, haut-de-forme cabossé, grand sourire blanc.
24. **Chiffonnière** · ♀ · un crochet à chiffons dans la main droite. Hotte débordante de tissus et de rubans dans le dos, tenue faite de bouts cousus ensemble.
25. **Champignonniste** · ♀ · un panier de champignons lumineux au bras gauche et un petit couteau dans la main droite. Chapeau en forme de champignon, tablier de mousse.

- **Keko** (22/10) : l'Archer reste ambigu, « on peut laisser le truc
  ambigu ». Les 25 illustrations découpées une par une sont dans
  `public/generations/gobelin/communs/` (`01-garde.png` … `25-champignonniste.png`,
  numérotées comme cette fiche).
- **Keko** (22/10) : **les 25 illustrations sont validées** telles quelles (seconde
  série, 05–08 restés de la première) ; le Ferrailleur, dessiné en femme,
  devient la **Ferrailleuse** (« ferailleuse femme ok »), depuis montée en peu
  commune (`13-ferrailleuse.png`).

**Peu communes gobelins : 6 hommes, 9 femmes (40/60)** — un cran au-dessus : plus
d'équipement, un savoir-faire qui se voit, sans être encore des personnages.
Mêlée 2 H / 1 F, distance 1 H / 3 F, magie 2 F, soutien 3 H / 3 F.

1. **Brute** · ♂ · un gourdin clouté tenu à deux mains. Le plus massif des gobelins, épaules énormes, tête petite, mâchoire en avant, chaîne cassée au poignet.
2. **Coupe-jarret** · ♀ · deux dagues courbes, une dans chaque main, tenues lame vers le bas. Foulard noir sur le bas du visage, accroupie, sourire qu'on devine aux yeux.
3. **Péagier** · ♂ · une barrière de bois rayée rouge et blanc tenue en travers à deux mains. Coffret à pièces cadenassé à la ceinture, clochette au cou, casquette de fonctionnaire trop grande, regard qui réclame.
4. **Arbalétrière** · ♀ · une arbalète trop lourde épaulée à deux mains. Carreaux dans un étui à la cuisse, une loupe de visée bricolée, un œil fermé.
5. **Lanceuse de bombes** · ♀ · une bombe ronde noire à mèche allumée dans la main droite, prête à lancer. Sacoche pleine de bombes, cheveux en pétard, rire de folle.
6. **Poseur de pièges** · ♂ · un piège à mâchoires ouvert dans les deux mains. Bandoulière de collets et de clochettes, accroupi, la langue entre les dents.
7. **Rétiaire** · ♀ · un trident dans la main droite et un filet lesté qu'elle fait tournoyer dans la gauche. Épaulière unique en métal, bras bandés, jupe de cuir à lanières, pose de gladiatrice.
8. **Apprentie** · ♀ · un gros grimoire ouvert tenu à deux mains. Robe trop longue, chapeau pointu affaissé, petite étincelle magique au-dessus du livre.
9. **Mangeuse de feu** · ♀ · une torche dans la main droite, crachant une gerbe de feu. Tenue de saltimbanque à losanges, bracelets, joues gonflées, une seconde torche à la ceinture.
10. **Dompteur de bêtes** · ♂ · un fouet dans la main droite. Un petit loup hérissé en laisse dans la gauche, gilet de cuir couvert de griffures, chapeau à plume.
11. **Prêteuse sur gages** · ♀ · un grand registre sous le bras gauche et une loupe dans la main droite. Lunettes sur le bout du nez, clés pendues à la ceinture, colliers et babioles mis en gage.
12. **Taxidermiste** · ♂ · une grosse aiguille et du fil dans la main droite, un corbeau empaillé dans la gauche. Tablier de cuir, petits yeux de verre dans une boîte à la ceinture, air un peu inquiétant.
13. **Ferrailleuse** · ♀ · un marteau dans la main droite. Chariot de casseroles cabossées derrière elle, tablier de cuir, une dent en métal.
14. **Horloger** · ♂ · un tournevis minuscule dans la main droite, une montre ouverte aux rouages apparents dans la gauche. Loupe vissée sur l'œil, gilet garni de chaînes de montres, petit oiseau mécanique remonté sur l'épaule.
15. **Contrebandière** · ♀ · un coutelas dans la main droite, la gauche qui ouvre un long manteau doublé de poches bourrées de fioles et de marchandises. Tricorne enfoncé, bandeau sur un œil, tonnelet en bandoulière, sourire en coin.

- **Keko** (22/10) a généré les 15 avec le **loup** du Dompteur (le rat géant
  proposé n'est pas retenu). Découpées une par une dans
  `public/generations/gobelin/peu-communes/` (`01-brute.png` …
  `15-contrebandiere.png`, numérotées comme cette fiche).

**Rares gobelins : 5 hommes, 6 femmes (45/55)** — un objet signature et une
silhouette qu'on reconnaît de loin, sans être encore des personnages nommés.
Mêlée 1 F, distance 2 H / 1 F, magie 3 H / 4 F.
Distinguées de leurs voisines : le Mycomancien (magie des spores) n'est pas
la Champignonniste (cueillette), la Ruche lancée n'est pas l'essaim dirigé de
l'Essaimancienne (sauterelles et scarabées, pas d'abeilles).

1. **Escrimeuse à l'ombrelle** · ♀ · une ombrelle en dentelle trouée à pointe d'acier, tenue comme une rapière dans la main droite. Main gauche dans le dos, robe de dame rapiécée, petit chapeau à voilette de travers, pose de duelliste précieuse.
2. **Canonnier** · ♂ · un petit canon de bronze sur l'épaule droite, la mèche fumante dans la main gauche. Bonnet enfoncé, chiffons dans les oreilles, boulets dans une besace, visage noirci par la poudre.
3. **Fauconnière** · ♀ · un vautour déplumé perché sur le gant de cuir de la main gauche. Leurre à plumes qui tournoie dans la main droite, capuchon de rapace à la ceinture, plumes dans les cheveux.
4. **Lanceur de ruches** · ♂ · une ruche de paille bourdonnante levée dans la main droite, prête à être lancée. Abeilles furieuses qui s'en échappent, visage piqué et boursouflé, filet de protection déchiré sur la tête.
5. **Pyromancienne** · ♀ · une boule de feu dans la main droite levée. Robe aux bords roussis, cheveux qui fument, petites flammes au bout des doigts de la main gauche.
6. **Mage de rouille** · ♂ · une clé géante rouillée tenue comme un sceptre dans la main droite. Armure de ferraille piquée de rouille, poussière orange qui tourbillonne autour de la main gauche.
7. **Cartomancienne** · ♀ · une carte retournée entre deux doigts de la main droite levée, un éventail de cartes lumineuses qui flottent en arc devant elle. Foulard noué sur la tête, grandes boucles d'oreilles, châle à franges, troisième œil peint sur le front.
8. **Ritualiste** · ♀ · une dague rituelle dans la main droite et une bougie noire dans la gauche. Cercle de craie aux runes lumineuses sous ses pieds, robe à capuche brodée d'yeux, os pendus au cou.
9. **Mycomancien** · ♂ · un bâton noueux couronné d'un champignon géant qui crache des spores dans la main droite. Peau tachée de moisissure, mycélium lumineux qui court sur ses bras, petits champignons qui poussent sur ses épaules.
10. **Sorcier** · ♂ · un bâton tordu surmonté d'un crâne de rat dans la main droite. Long manteau rapiécé à capuche, barbiche, lueur verte dans la main gauche.
11. **Alchimiste** · ♀ · une fiole bouillonnante dans la main droite et une autre dans la gauche. Lunettes rondes, ceinture de flacons colorés, tablier taché de toutes les couleurs.

- **Keko** (22/10) a généré les 11 en trois planches. Découpées une par une
  dans `public/generations/gobelin/rares/` (`01-escrimeuse-a-l-ombrelle.png`
  … `11-alchimiste.png` depuis le reclassement), le seuil d'alpha descendu à 16 pour garder les
  reflets translucides de l'Illusionniste et tout l'essaim de
  l'Essaimancienne.

**Épiques gobelins : 3 hommes, 5 femmes (38/62)** — presque des personnages :
une monture, une machine ou un effet qui occupe l'image, une tenue plus
soignée que le reste de la tribu. Mêlée 1 H, distance 1 H / 2 F, magie 1 H /
3 F. Avec les légendaires (Snik ♂, Mère Gribouille ♀, Zabbo ♂), le gobelin
entier fait 30 hommes et 33 femmes (avec Grisette). Distinguées de leurs voisines :
le Cerf-voliste vole au vent, l'Aéronaute à la machine ; l'Artificière tire
des fusées de couleur, pas les explosifs du Pétardier ni de la Lanceuse de
bombes ; la Cartomancienne lit l'avenir dans des cartes qui flottent,
l'Illusionniste en fait jaillir de sa manche ; l'Horloger est de la mécanique
fine, pas le bric-à-brac du Bricoleur.

1. **Chevaucheur de rat** · ♂ · une lance courte à fanion dans la main droite, les rênes dans la gauche, en selle sur un rat géant cabré aux dents jaunes. Casque à cornes de travers, selle rapiécée garnie de clochettes, queue du rat enroulée au premier plan.
2. **Cerf-voliste** · ♂ · le fil d'un grand cerf-volant de toile rapiécée dans les deux mains, les pieds décollés du sol, tiré dans les airs. Écharpe qui claque au vent, lunettes de vol, sacoche de cailloux à lâcher sur l'ennemi.
3. **Aéronaute** · ♀ · une longue-vue dans la main droite, la gauche agrippée aux cordages d'une petite nacelle sous un ballon de rustines. Casque de cuir à oreillettes, lunettes relevées, sacs de lest qui pendent autour de la nacelle.
4. **Artificière** · ♀ · un tube lance-fusées sur l'épaule droite, une fusée allumée dans la main gauche. Gerbe d'étincelles colorées derrière elle, cheveux roussis, bandoulière de fusées peintes à rayures.
5. **Illusionniste** · ♂ · un masque souriant tenu devant le visage dans la main gauche, cartes et foulards qui jaillissent de la manche droite. Cape violette étoilée, deux reflets translucides de lui-même de chaque côté.
6. **Électromancienne** · ♀ · une bobine de cuivre crépitante dans la main droite levée, éclairs bleus entre ses doigts. Cheveux dressés par l'électricité, lunettes de soudeuse, batterie bricolée dans le dos reliée par des câbles.
7. **Essaimancienne** · ♀ · rien dans les mains : les deux bras tendus dirigent un nuage de sauterelles et de scarabées qui tourbillonne autour d'elle. Châle de toile percée, yeux à facettes peints sur le front, antennes de criquet dans les cheveux.
8. **Gardienne des clés** · ♀ · un bâton crochu dans la main droite où pend une lanterne aux flammes spectrales vertes, une grosse clé ancienne dans la gauche. Grande capuche verte en lambeaux, sourire en coin, feux follets qui flottent autour d'elle.

- **Keko** (22/10) a généré les 7, plus **un extra hors fiche** : une
  gobeline encapuchonnée de vert, une lanterne aux flammes spectrales
  pendue à un bâton crochu, une grosse clé dans l'autre main, des feux
  follets autour d'elle, devenue la **Gardienne des clés** au reclassement.
  Le Cerf-voliste est dessiné en planeur à ailes de toile, sans fil (à
  valider). Découpés dans `public/generations/gobelin/epiques/`
  (`01-chevaucheur-de-rat.png` … `08-gardienne-des-cles.png`).

**Légendaires gobelins : 2 hommes, 2 femmes** — des personnages uniques et
nommés, le dernier cran de l'escalade : **une scène entière**, des dorures,
une pose héroïque, un décor ou un élément qui déborde de la silhouette.
Chacun reprend le vocabulaire de la tribu en plus grand, pour qu'on
reconnaisse le chef de ce qu'on a déjà vu : Snik monte plus haut que le
Chevaucheur de rat, Mère Gribouille règne sur ce que font le Sorcier, la
Ritualiste et le Mycomancien, Zabbo construit ce que le Bricoleur rafistole,
Grisette possède ce que la Contrebandière et la Coupe-jarret volent.

1. **Snik le Rusé** · ♂ · chef de guerre · un sabre courbe doré levé dans la main droite, une carte au trésor froissée dans la gauche. Debout sur un trône de caisses volées et de boucliers ennemis empilés, couronne de fer tordu trop grande, longue cape rouge bordée de fourrure, sourire de fourbe, un œil plissé ; des fanions de la tribu flottent derrière lui.
2. **Mère Gribouille** · ♀ · chamane · un grand bâton couvert de grigris, de plumes et d'os dans la main droite, la gauche qui remue un chaudron bouillonnant d'où montent des esprits verts en spirale. Vieille, voûtée, nez immense, cheveux blancs en broussaille piqués de champignons, masque d'os sur le front, manteau de peaux cousues brodé de runes dorées ; un crapaud sur l'épaule.
3. **Zabbo Boulon-Fou** · ♂ · ingénieur · aux commandes d'une machine de guerre bricolée à grandes pattes de métal, une clé géante brandie dans la main droite, la gauche sur un levier. Cheveux électrisés, lunettes de soudure, harnais bourré d'outils, boulons et rivets dorés partout, la machine qui crache vapeur et étincelles, une hélice qui tourne sur son dos.
4. **Grisette la Dorée** · ♀ · reine des voleurs · une dague dorée dans la main droite, un trousseau de clés anciennes qui pend de la gauche. Assise jambes croisées sur un coffre ouvert débordant de pièces, de colliers et de coupes d'or, capuche violette à la doublure sombre, diadème d'or sur le front, sourire narquois.

- **Keko** (22/10) a généré les 3 en une planche, plus **un bonus hors
  fiche** : une gobeline à capuche violette et diadème d'or, une dague dorée
  dans une main, un trousseau de clés dans l'autre, assise sur un coffre
  débordant d'or et de bijoux. **Keko** (« ok pour la 1 ») : elle devient la
  4ᵉ légendaire, **Grisette la Dorée**, reine des voleurs (classe de mêlée).
  Découpés dans `public/generations/gobelin/legendaires/`
  (`01-snik-le-ruse.png` … `04-grisette-la-doree.png`). Keko a remplacé la
  planche le même jour par une version redessinée plus finement (Grisette
  tient trois clés nettes) ; les découpes sont refaites dessus.

### La fiche des communes orcs (proposition, 22/10/2026)

- **Les noms sont ceux du renommage** (« Un nom par carte »), accordés au
  sexe de la carte (Fracasseuse, Archère de la horde…).
- **L'échelle des gobelins s'applique dès la fiche** : une commune, c'est
  **un objet, pas d'effet, pas d'animal**. Le Cracheur de braise tient un
  pot de braises plutôt qu'une boule de feu ; le Dresseur de wargs n'a pas
  de warg à l'image, seulement le fouet, le sifflet et les morsures.
- **L'orc se distingue du gobelin par la masse** : grand, trapu et musclé,
  défenses qui sortent de la mâchoire, cicatrices, os, fourrure et fer brut
  plutôt que chiffons rapiécés. Chaque sexe est choisi à l'opposé de la carte
  gobeline la plus proche quand il y en a une (Archer ♂ → Archère ♀,
  Cuisinière ♀ → Rôtisseur ♂…).
- **Communes orcs : 12 hommes, 10 femmes (55/45).** Mêlée 3 H / 3 F,
  distance 2 H / 3 F, magie 1 H, soutien 6 H / 4 F.

1. **Cogneur de porte** · ♂ · une massue cloutée posée sur l'épaule droite. Planté jambes écartées comme un videur, bras croisés à moitié, gorgerin de cuir, une défense cassée, regard qui interdit le passage.
2. **Fracasseuse** · ♀ · une grande hache à deux mains, à double tranchant ébréché. Tresses épaisses, épaulières en os, peinture de guerre rouge sur les yeux, en plein élan.
3. **Embrocheuse** · ♀ · une lance à pointe barbelée tenue à deux mains, pointe en avant. Plastron de cuir clouté, crâne rasé sur les côtés, crocs serrés, pose de charge.
4. **Cogne-poing** · ♂ · les poings nus serrés dans des poings américains en fer. Torse nu couvert de cicatrices, oreilles en chou-fleur, nez cassé, garde de lutteur.
5. **Mastodonte** · ♂ · rien d'autre que ses poings énormes et une chaîne rompue qui pend d'un bracelet de fer. Le plus massif des orcs, tête minuscule sur un corps immense, ventre en avant, regard bovin.
6. **Batteuse de chaîne** · ♀ · un fléau à boule cloutée dans la main droite, la chaîne qui tournoie. Brassards de fer, cotte de mailles trouée, sourire carnassier.
7. **Archère de la horde** · ♀ · un grand arc en corne dans la main gauche, une flèche à plumes noires encochée. Carquois en peau dans le dos, bandeau de fourrure, défenses ornées d'anneaux.
8. **Traqueur** · ♂ · une machette dans la main droite, la gauche qui écarte les herbes. Manteau de peaux de bêtes, crâne de loup en capuche, accroupi sur une piste, narines dilatées.
9. **Lanceur de hachettes** · ♂ · une hachette dans chaque main, une troisième entre les dents. Ceinture couverte de hachettes, bras épais, rictus de défi.
10. **Lanceuse de pierres** · ♀ · une pierre grosse comme une tête levée à deux mains au-dessus de la tête, prête à la jeter. Sac de cailloux en bandoulière, bras et épaules énormes, mâchoire serrée, pieds plantés dans la poussière.
11. **Lance-mâchoire** · ♀ · une mâchoire de bête taillée en boomerang dans la main droite. Colliers de dents, peintures blanches sur les bras, cheveux en crête, en plein élan.
12. **Cracheur de braise** · ♂ · un pot de terre rempli de braises rougeoyantes tenu dans la main gauche, la droite qui en porte une à la bouche. Joues gonflées, sourcils brûlés, pagne roussi, un filet de fumée seulement.
13. **Éleveuse de cochons** · ♀ · un seau de pâtée dans la main droite et un bâton de berger dans la gauche. Tablier de cuir boueux, bottes crottées, joues rondes, air content d'elle.
14. **Rôtisseur** · ♂ · une broche avec un cuissot rôti sur l'épaule droite, un couperet dans la gauche. Tablier taché de graisse, ventre énorme, bras velus, sourire gourmand.
15. **Creuse-roc** · ♀ · un pic de mineur à deux mains, levé haut. Casque de fer cabossé, poussière de pierre sur les épaules, gants de cuir troués, bras noueux.
16. **Abatteuse d'arbres** · ♀ · une scie de long passée en travers des épaules, tenue à deux mains. Chemise de laine aux manches arrachées, copeaux dans les cheveux, bûche sous le pied.
17. **Batteur de fer** · ♂ · un lourd marteau de forge dans la main droite, une pince tenant un fer chauffé dans la gauche. Tablier de cuir brûlé, bras énormes, barbe courte roussie.
18. **Rebouteuse** · ♀ · une attelle de bois et des bandes de tissu dans les mains, prête à remettre un os en place. Colliers d'os et de griffes, sacoche de remèdes, manches retroussées, regard sans pitié.
19. **Pilleur d'épaves** · ♂ · un grappin au bout d'une corde enroulée sur l'épaule droite, un bouclier rouillé de récupération dans la gauche. Vêtements mouillés, algues dans le col, ceinture de trouvailles cabossées.
20. **Dresseur de wargs** · ♂ · un fouet roulé dans la main droite et un sifflet en os à la bouche. Bras couverts de traces de morsures, collier clouté de warg pendu à la ceinture, peau de warg sur le dos.
21. **Bête de somme** · ♂ · un énorme tonneau sur le dos, tenu par une sangle passée sur le front. Courbé mais pas épuisé, jambes comme des troncs, un second sac sous le bras.
22. **Hurleur de légendes** · ♂ · un bâton surmonté d'un crâne gravé dans la main droite, la gauche tendue vers le ciel. Bouche grande ouverte en plein récit, cape de fourrure, tatouages qui racontent ses histoires sur les bras.

- **Keko** (22/10) : la Jeteuse de guêpiers était « trop proche du
  gobelin » (le Lanceur de ruches) ; remplacée par la **Lanceuse de pierres**,
  la première marche de l'orc qui jette des choses lourdes, avant le Lanceur
  de rochers (rare, l'ancien Catapultier).
- **Voisins à surveiller** : le Pilleur d'épaves frôle
  la Ferrailleuse, la Bête de somme le Porteur, l'Éleveuse de cochons le
  Fermier. *Noms et sexes à rejuger par Keko.*
- **Keko** (23/10) a généré les 22 en six planches. Découpées une par une
  dans `public/generations/orc/communs/` (`01-cogneur-de-porte.png` …
  `22-hurleur-de-legendes.png`, numérotées comme cette fiche), et commitées.
  La Dresseuse de wargs se lisait en homme : elle devient le **Dresseur**
  (Keko, « on le passe en dresseur »), `20-dresseur-de-wargs.png`.

**Peu communes orcs : 6 hommes, 8 femmes (43/57)** — un cran au-dessus des
communes : plus d'équipement et de métier, **un effet léger ou un petit
animal** au plus (les ronces de la Sage, la fissure du Fendeur, le marcassin
du Pisteur). Mêlée 3 H / 4 F, distance 1 H / 2 F, magie 2 H / 1 F, soutien
1 F. Avec les communes, l'orc est à 18 hommes, 18 femmes. Les sexes sont
pris à l'opposé de la carte gobeline la plus proche (Péagier ♂ →
Rançonneuse ♀, Mangeuse de feu ♀ → Avaleur de braises ♂).

1. **Maître de la fosse** · ♂ · un fouet de dressage dans la main droite, un gourdin d'entraînement dans la gauche. Vieux combattant couturé de cicatrices, oreille arrachée, sable de l'arène sur les bottes, sifflet pendu au cou.
2. **Brise-bouclier** · ♀ · un marteau de guerre à long manche tenu à deux mains. Éclats de boucliers ennemis cloués sur sa ceinture comme des trophées, épaulière en fer, tresse unique, regard fixe.
3. **Masse-d'os** · ♂ · une massue faite d'un énorme fémur de bête cerclé de fer, dans la main droite. Collier de vertèbres, crâne de bête en épaulière, peinture blanche en forme d'os sur le torse.
4. **Briseuse de crânes** · ♀ · une masse à tête de pierre grossièrement taillée tenue à deux mains au-dessus de la tête. Casque à cornes ébréchées, brassards cloutés, crocs découverts, pose d'abattage.
5. **Écorcheuse** · ♀ · un couteau à dépecer courbe dans chaque main. Tablier de cuir taché, peaux tendues séchant sur un cadre dans son dos, gants retroussés, sourire froid.
6. **Coupeur de têtes** · ♂ · une immense hache de bourreau posée sur l'épaule droite. Cagoule noire à trous pour les yeux, torse nu énorme, billot de bois sous le pied gauche.
7. **Rançonneuse** · ♀ · une hache dans la main droite, la gauche tendue paume ouverte pour réclamer. Assise sur un tas de sacs et de coffres extorqués, bourses pendues partout à sa ceinture, petit sourire d'usurière.
8. **Javelinière** · ♀ · un javelot levé dans la main droite, prête à lancer, un faisceau de javelots dans le dos. Jambières de fourrure, bras tatoués de traits, cheveux tressés serrés, en pleine course.
9. **Pisteur** · ♂ · une lance courte dans la main droite, la gauche tenant la laisse d'un marcassin qui renifle le sol. Cape de feuillage, nez au vent, pieds nus, empreintes moulées en argile à la ceinture.
10. **Lanceuse de bolas** · ♀ · des bolas de pierre qui tournoient au-dessus de sa tête dans la main droite. Une deuxième paire à la ceinture, foulard sur la bouche, jambes fléchies, regard qui vise.
11. **Sage des ronces** · ♀ · un bâton noueux d'où poussent des ronces vertes qui s'enroulent sur son bras droit. Vieille, cheveux en broussaille piqués de baies, manteau de mousse, épines dans les cheveux.
12. **Fendeur de terre** · ♂ · un grand pieu de pierre enfoncé dans le sol à deux mains, une petite fissure lumineuse qui court sous ses pieds. Peau couverte de poussière, runes de terre peintes sur les bras, cailloux qui tremblent autour.
13. **Avaleur de braises** · ♂ · une longue épée rougie au feu qu'il fait descendre dans sa gorge, tenue de la main droite. Torse nu tatoué de flammes, ventre lumineux comme un four, braises qui tombent de sa bouche.
14. **Porte-étendard** · ♀ · une grande bannière de guerre en peau tendue sur une perche, tenue à deux mains. Bannière peinte du crâne de la horde, cor de guerre à la ceinture, cape rouge, bouche ouverte sur un cri.

- **À surveiller** : l'Avaleur de braises orc (peu commune) reste dans le
  même terrain que la Mangeuse de feu gobeline (peu commune aussi) et le
  Cracheur de braise orc (commun) : trois cartes de feu avalé. Son épée
  rougie le distingue de la torche gobeline, mais une autre classe à la
  place serait plus nette. La Rançonneuse partage l'idée du Péagier
  gobelin (réclamer) sans sa barrière. *Noms et sexes à rejuger par Keko.*
- **Illustrées par Keko** (23/10) telles que la fiche, Avaleur de braises
  compris. Découpées dans `public/generations/orc/peu-communes/`
  (`01-maitre-de-la-fosse.png` … `14-porte-etendard.png`, numérotées comme
  cette fiche).

**Rares orcs : 5 hommes, 5 femmes** (proposition, 23/10/2026) — **un effet
fort ou une mise en scène** : un décor, une bête de taille, une machine à
bras. Mêlée 3 H / 1 F, distance 1 H / 1 F, magie 1 H / 2 F, soutien 1 F.
L'orc passe à 23 hommes, 23 femmes.

1. **Combattante de l'arène** · ♀ · un couperet court dans la main droite, un bouclier rond hérissé de pointes au bras gauche. Chaînes brisées aux poignets, sable de l'arène qui vole sous ses pieds, pièces et fleurs jetées par la foule autour d'elle, poing levé de victoire.
2. **Ravageur** · ♂ · une chaîne énorme dans la main droite, qui traîne derrière lui une porte de palissade arrachée. Hache passée dans la ceinture, éclats de bois qui volent, piquets brisés à ses pieds, cri de charge.
3. **Massacreur** · ♂ · une grande hache à double lame tenue à deux mains, lancée dans un tourbillon. Traînées de mouvement en cercle autour de lui, poussière soulevée, tresses qui fouettent l'air, crocs serrés.
4. **Lutteur d'ours** · ♂ · aucune arme : les deux bras serrés autour du cou d'un ours brun dressé contre lui. Torse nu couvert de griffures, ceinture de champion en fer, pieds arc-boutés dans la terre, sourire de défi.
5. **Lanceuse de harpon** · ♀ · un harpon barbelé levé dans la main droite, la corde enroulée sur l'avant-bras gauche. Debout à la proue d'un radeau de rondins, gerbe d'eau, une grande anguille de mer qui jaillit des vagues devant elle.
6. **Lanceur de rochers** · ♂ · la main droite qui abat le levier d'une petite catapulte de bois à bras, un rocher qui part du godet. Tas de rochers à côté, cordes et roues grossières, éclats de pierre en l'air, bouche ouverte de plaisir.
7. **Haruspice** · ♂ · un couteau d'os dans la main droite, la gauche ouverte au-dessus d'un plat de pierre où des os luisent. Fumée verte qui monte en signes, crânes de bêtes et bougies autour, yeux révulsés, manteau de peaux.
8. **Chantre des roches** · ♀ · aucune arme : les deux mains levées, bouche ouverte sur un chant. Derrière elle un menhir gravé qui vibre, des pierres qui flottent en cercle autour d'elle, ondes visibles dans l'air, collier de cailloux polis.
9. **Mage de cendre** · ♀ · un bâton de bois calciné dans la main droite, fumant au bout. Nuage de cendre grise qui tourbillonne autour d'elle, braises orange dedans, visage et bras peints de suie, cheveux gris de cendre.
10. **Meneuse d'ours** · ♀ · un tambourin dans la main droite, la chaîne d'un ours muselé dans la gauche. L'ours dressé sur ses pattes arrière danse à côté d'elle, coiffé d'un petit chapeau, grelots à ses chevilles à elle, sourire de foire.

- **Sexes** : l'opposé de la carte la plus proche quand il y en a une
  (Maître de la fosse ♂ → Combattante ♀, Lanceuse de pierres ♀ → Lanceur de
  rochers ♂, Dresseur de wargs ♂ → Meneuse ♀, Ritualiste ♀ → Haruspice ♂,
  Fendeur de terre ♂ → Chantre ♀). La Mage de cendre est une femme parce que
  tout le feu orc était masculin (Cracheur de braise, Avaleur de braises),
  bien que la Pyromancienne gobeline rare soit une femme : cendre et flammes
  ne se dessinent pas pareil.
- **Deux ours au même cran** : le Lutteur se bat contre le sien, la Meneuse
  fait danser le sien. *Noms et sexes à rejuger par Keko.*
- **Illustrées par Keko** (23/10) telles que la fiche. Découpées dans
  `public/generations/orc/rares/` (`01-combattante-de-l-arene.png` …
  `10-meneuse-d-ours.png`, numérotées comme cette fiche) ; une goutte de la
  gerbe du harpon, tombée chez le Lanceur de rochers, a été retirée à la
  main. Le Massacreur, tresses et visage fin, se lit plutôt en femme.

**Épiques orcs : 3 hommes, 3 femmes** (proposition, 23/10/2026) — **une
monture, une machine ou une explosion** qui occupe l'image, une tenue plus
soignée que la horde (métal travaillé, fourrures choisies, bijoux). Mêlée
2 H / 1 F, magie 2 F, soutien 1 H. L'orc passe à 26 hommes, 26 femmes,
avant ses légendaires (Grumbak ♂, Ursha ♀, Ghor ♂). Le loup est gardé pour
Ursha : aucune épique ne le monte.

1. **Seigneur de horde** · ♂ · une grande hache de guerre ornée levée dans la main droite, les rênes dans la gauche, en selle sur un énorme sanglier de guerre caparaçonné de fer. Défenses du sanglier cerclées d'or, cape de fourrure noire, casque à cornes, bannière de la horde plantée dans la selle.
2. **Championne** · ♀ · une épée à deux mains plantée dans le sol, les deux mains sur le pommeau. Debout sur la tête d'un énorme serpent de roche abattu, onde de choc qui fend la pierre autour de la lame, armure de plaques dépareillées, trophées de dents en collier.
3. **Berserker** · ♂ · une hache dans chaque main, bras écartés. Aura de rage rouge qui explose autour de lui, yeux blancs brillants, veines lumineuses sur les bras, sol qui éclate sous ses pieds, peintures de guerre rouges.
4. **Sorcière du sang** · ♀ · une dague rituelle courbe dans la main droite, la gauche levée qui fait tourner des rubans rouges lumineux. Sphères pourpres qui flottent autour d'elle, lune rouge derrière, robe de cuir sombre, ongles noirs, sourire inquiétant.
5. **Tatoueuse runique** · ♀ · une aiguille d'os dans la main droite, la gauche levée. Les runes de ses bras s'envolent et forment derrière elle un grand esprit de bélier en lumière bleue. Crâne rasé couvert de runes.
6. **Tambour de guerre** · ♂ · deux battes en os levées pour frapper. Debout sur le dos d'un rhinocéros laineux qui porte un tambour géant, anneaux d'onde sonore qui s'en échappent.

- **Distinguées de leurs voisines** : le Berserker explose de rage, le
  Massacreur (rare) tourne ; la Championne a vaincu une bête, la Combattante
  de l'arène (rare) gagne devant la foule ; la Sorcière du sang n'a rien des
  os de l'Haruspice ; la Tatoueuse fait jaillir ses runes, le Fendeur de
  terre (peu commune) les a peintes ; le Tambour est une machine, la
  Porte-étendard (peu commune) n'a que son cri. *Noms et sexes à rejuger par
  Keko.*
- **Keko** (23/10) : la Tatoueuse et le Tambour « manquent un peu de côté
  légendaire » — chacun reçoit une grande créature (l'esprit de bélier, le
  rhinocéros laineux) ; puis « un peu trop détaillé, le modèle perd le style
  minimaliste » : **une épique = une grande idée et deux ou trois détails**,
  pas plus.
- **Illustrées par Keko** (23/10). Découpées dans
  `public/generations/orc/epiques/` (`01-seigneur-de-horde.png` …
  `06-tambour-de-guerre.png`, numérotées comme cette fiche). La Tatoueuse
  n'a pas le crâne rasé et se lit moins nettement en femme.
- **Deux bonus dessinés par Keko** : un **pêcheur** (lance, hotte, gros
  poisson ; Keko le voit commun), rangé à part dans
  `public/generations/orc/bonus/`, place à trancher ; et un **porteur de
  clés** (capuche, trousseau, coffret), **supprimé** — trop proche de la
  Gardienne des clés, de la Contrebandière et de la Rançonneuse (Keko : « ça
  nous fait cramer une classe pour rien »).


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
- **Les cibles de Keko pour 24 paquets par jour** : plusieurs rares, 1–2
  épiques, une légendaire tous les 4–7 jours. **Taux réglés dessus** (4 000
  jours simulés) : cartes 1–4 81 / 16 / 2,5 / 0,4 / 0,02 % ; carte 5
  — / 82,15 / 15 / 2,5 / 0,35 % ; épique garantie au 24e paquet sans épique,
  légendaire au 200e (~8 jours). Résultat : 6 rares par jour (3–9), 1,5
  épique (0 : 7 % des jours, 1 : 55 %, 2 : 26 %, 3+ : 12 %), une légendaire
  tous les 4,6 jours (8,3 au pire décile). Les chiffres du paragraphe
  précédent sont remplacés par ceux-ci.
- **Protection contre les doublons : LÉGENDAIRES UNIQUEMENT** (Keko) — une
  légendaire tirée est toujours une qu'on n'a pas tant qu'il en manque. Les 24
  en ~3–4 mois ; les 43 épiques, au hasard, en ~3 mois.
- **Les doublons deviennent des stickers, et les stickers remplissent un
  ALBUM** (Keko) : une case par carte. **Des SÉRIES de cases débloquent des
  passifs** (« 3 paladins = les paladins ont +1 »). **Un sticker posé sur un
  sticker déjà dans l'album fait monter la carte d'un niveau**, au coût qui
  double : 1 sticker pour le niveau 1, puis 2, puis 4… (2^n stickers en tout
  pour le niveau n, case comprise). Le prix des paquets de la boutique : plus
  tard.

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

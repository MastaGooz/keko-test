# Le magicien — `?magicien`, un side project

Keko (08/11), après le gobelin du banc pixelfx : « faut un proto avec un jeu
en vue de côté (genre plateforme tu vois) avec le magicien (créer le
mannequin) à gauche et les ennemis (gobelins qui arrivent par la droite) :
version vue de côté du Magicka-like qu'on avait ».

## Ce que c'est

**La tour du magicien (`?magie`) VUE DE CÔTÉ, EN PIXEL ART.** La règle est
la même, réutilisée telle quelle : `logic/magie/jeu.ts` (la file de trois
éléments, les opposés qui s'annulent, la forme du sort — souffle, éclair,
rocher, rayon, halo, élémentaire —, les cinq ennemis et leurs faiblesses, les
vagues, les PV). Une seule ligne y a changé : la `Vue` a un drapeau `cote`,
et quand il est posé les ennemis naissent À DROITE, SUR LA LIGNE DU SOL
(`horsDeLEcran`). Le magicien est à l'origine, à gauche ; tout le monde
marche sur la même ligne.

Le dessin est celui de pixelfx :

- **Les personnages sont NOS mannequins** (`ui/pixelfx/perso/`), posés par le
  squelette image par image : le MAGICIEN (`personnages.js` : grand, mince,
  chapeau pointu — un bord plat et un cône un peu penché, trait `chapeau` du
  squelette —, robe bleue, son bâton est l'arme `staff` ajoutée au squelette,
  un manche de bois à orbe d'or), le GOBELIN, l'ORC (large, défenses
  longues, peau gris-vert), le GOLEM (massif, de pierre, yeux de braise), le
  SQUELETTE (maigre, en os, yeux rouges). L'esprit de feu n'a pas de corps :
  c'est `fire/spirit-flame` qui suit sa position.
- **Les poses** : les ennemis marchent avec le cycle de `keko/gobelin-marche`
  (son horloge suit leur vitesse : un orc marche plus lentement qu'un
  gobelin, un ralenti aussi, un gelé est figé) et attaquent au pied du
  magicien avec une piste à trois clés (la garde, l'élan, le coup) calée sur
  `coupA` : le coup tombe à l'instant où la règle enlève les PV. Le magicien
  respire (une piste en boucle), incante (le bâton se lève puis pointe d'un
  coup ; **le sort part à 0,2 s, quand il pointe** — la règle est appelée à
  ce moment-là, `aLancer`), et encaisse (il recule). Les états se lisent à
  la teinte du corps (`peindrePose`, l'encre épargnée) : gelé bleu pâle,
  brûlé orange qui vacille, affaibli violet, ralenti bleuté, touché blanc
  une image ; une barre de vie au-dessus quand il a été touché.
- **Les sorts sont des effets du dépôt**, posés dans le même tampon : le
  souffle `fire/fire-breath` ou `ice/frost-breath` à la main (0,55 s puis
  l'arrêt qui le fond), le rayon `arcane/arcane-beam` en violet (0,5 s), le
  halo `holy/heal` sur le magicien, l'élémentaire `fire/spirit-flame` à la
  palette de son élément qui suit sa position (`options.x` est lu au
  dessin : déplacer un effet, c'est le réécrire), ses coups et chaque touche
  `impacts/hit-spark` à la palette de l'élément, l'impact du rocher
  `impacts/crit-hit` (terre, ou feu), chaque mort `spawn/poof`, chaque coup
  reçu une étincelle rouge, une secousse et un voile rouge. **Deux effets
  sont écrits dans la page** : l'ÉCLAIR (des traits brisés `bolt` d'un point
  au suivant, reseedés 40 fois par seconde pour trembler, une lueur) et le
  ROCHER (une pierre qui tourne, un côté à l'ombre ; de feu, elle rougeoie et
  sème des braises ; sa hauteur suit une cloche sur son trajet).
- **Un tampon de 192 × 112, le sol à 96, le magicien à 30 ; 2 px par unité
  du monde** (la portée du souffle, 34 unités, fait 68 px), agrandi par un
  entier (×2 au téléphone, jusqu'à ×6) et centré — *le pixel a la même
  taille pour tout ce qui s'y dessine*. Le fond est le `ground` du dépôt,
  provisoire. Les chiffres, la roue et la bannière sont sur une SURCOUCHE
  (un second canvas, en px CSS) : du texte net sur du pixel art.
- **Les commandes sont celles de la tour** : la roue sous le doigt (glisser
  vers un quartier pour ajouter, relâcher sans glisser pour lancer ; de la
  tape, seule compte la droite ou la gauche du magicien, il se retourne),
  1 à 6 au clavier, Entrée ou Espace lance droit devant. La file, le nom du
  sort et sa recette sont en bas, le ✕ vide la file. Les sons sont ceux de
  la tour (`ui/magie/sons.ts`). Record : la vague atteinte
  (`keko-magicien-record`).

## Les fichiers

- `src/ui/magicien/page.ts` + `magicien.css` — tout le proto ; classes
  préfixées `magicien-`.
- `src/logic/magie/jeu.ts` — la règle partagée, et `Vue.cote`.
- `src/ui/pixelfx/perso/` — le squelette (`rig.js`, dont `staff` et
  `chapeau`), `peindrePose` / `peindreOmbre` dans `acte.js`, `gobelin.js`,
  `personnages.js`.

## Ce qui reste à faire, et à juger par Keko

- Un vrai décor de côté (ciel, collines, un sol de dalles) à la place du
  fond du dépôt ; une plateforme ou deux si « genre plateforme » voulait dire
  qu'on y saute.
- Le magicien ne bouge pas : il n'a pas de commande de déplacement, comme la
  tour. S'il doit marcher, le cycle est prêt.
- Les ennemis se chevauchent au pied du magicien (ils s'arrêtent tous à la
  même distance) : une file d'attente, ou le second qui frappe par-dessus.
- Mesuré seulement au scénario de capture (démarrer, terre + feu, lancer :
  le rocher vole, frappe, le gobelin tombe en poof) ; pas encore joué au
  doigt.

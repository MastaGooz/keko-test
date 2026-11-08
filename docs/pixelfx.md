# Le banc pixelfx — `?pixelfx`

Keko (08/11) : « il paraît qu'il y a un repo GitHub pixelfx super intéressant ?
[…] Je veux juste voir ce que ça donne visuellement, fais un proto test qui
permet d'en utiliser. »

## Ce que c'est

[patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) : 244 effets en
pixel art (feu, explosions, magie, météo, impacts, interface, ramassages,
transitions, bestioles, et douze « coups » complets joués par un personnage),
chacun **écrit en code**, sans sprite ; MIT ; sans dépendance côté navigateur.
Un effet se crée (`createFx(module, { x, y, flip, angle, seed, palette })`), se
met à jour à pas fixes, se dessine en deux couches dans un tampon de pixels
(`createFrame`) que `composite` pose sur un `ImageData` ; le CSS agrandit le
canvas sans lisser. `palette` recolore n'importe quel effet. Le dépôt livre
aussi un export en planche de sprites et un skill Claude Code.

**C'est la première dépendance de code du projet.** La règle « pas de
dépendance, pas d'asset qui ne vienne pas de Keko » visait les assets et les
moteurs ; ici c'est du code MIT, installé depuis GitHub
(`npm i github:patch-gg/pixelfx`, `pixelfx@0.3.0`), à la demande de Keko, pour
juger. Rien d'autre que le banc ne l'importe.

## Les fichiers

- `src/ui/pixelfx/page.ts` + `pixelfx.css` — le banc : le lecteur collé en
  haut (le canvas pixelisé, le nom, la description, les réglages), la ligne
  des catégories, la liste des effets. Classes préfixées `pixelfx-`. Pas de
  `logic/` : rien à régler, rien à vérifier.
- `src/pixelfx.d.ts` — le paquet est en JavaScript sans types ; déclaré tel
  quel, la page pose ses types sur ce qu'elle utilise.

## Le banc

- Le registre `pixelfx/fx/index` donne tous les effets par identifiant
  (`explosions/big-explosion`) ; la liste les montre par catégorie (une ligne
  de pastilles, « tout » en premier), avec leur nom et leur identifiant.
- Le lecteur refait la galerie du dépôt : une scène aux dimensions de
  `meta.size` plus 15 %, au format 16/10 au moins ; l'effet posé à
  `meta.origin` ; le fond de `meta.bg` (`backdrop`, le sol à la hauteur de
  l'origine) ; les pas de `1 / meta.fps` ; un effet fini se rejoue après
  0,6 s. Les « coups » (`moves/`) passent par `createAct`.
- Les réglages : la palette (la sienne, les palettes du dépôt s'il en
  exporte, et trois à nous : néon cyan, néon magenta, or — pour voir un
  effet aux couleurs de Néon), le fond (le sien, ou dark, ground, sky, light,
  black, aucun), la vitesse (×1, ×0,5, ×0,25, ×2), Retourner, Autre graine,
  Pause.
- Un effet qui casse (création, mise à jour ou dessin) ne casse pas le banc :
  le message s'affiche à la place de la description.

## Ce qu'on en pense

À écrire quand Keko aura regardé. Les pistes : les impacts et explosions des
envahisseurs, les coups du donjon (les douze « moves » ressemblent à ce
qu'on a dessiné à la main pour les armes), les sorts de la tour du magicien.
Néon est en vecteurs lisses : du pixel art n'y irait qu'en changeant son
style.

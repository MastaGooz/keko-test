/**
 * `pixelfx` est écrit en JavaScript sans types : on le déclare tel quel, et
 * `ui/pixelfx/page.ts` pose ses propres types sur ce qu'il utilise.
 */
declare module 'pixelfx'
declare module 'pixelfx/fx/index'
/** Les aides des effets `ui/` du dépôt (plaques, mots en relief) : le hangar du vaisseau s'en sert. */
declare module 'pixelfx/fx/ui/_lib'
/** Les aides des effets de feu du dépôt (les bouffées de flamme et de fumée de la Fireball) : le lance-flammes s'en sert. */
declare module 'pixelfx/fx/fire/_lib'
/** Les aides des effets d'éclairs du dépôt (la forme des éclairs, leur encre) : la Sentinelle s'en sert. */
declare module 'pixelfx/fx/lightning/_lib'
/** Les aides des effets de glace du dépôt (les flocons) : le givre du Frimas s'en sert. */
declare module 'pixelfx/fx/ice/_lib'

/**
 * NOS EFFETS pixelfx, écrits avec le skill du dépôt (brouillon → rendu → regard → retouche → contrôle), un
 * fichier par effet, dans la langue du dépôt (`meta` + `create(o)` ou `draw(p, t, o)`, importés depuis
 * `pixelfx`). Ils se rendent et se contrôlent avec les outils du dépôt pointés sur ce dossier
 * (`docs/pixelfx.md`), et le banc `?pixelfx` les montre dans la catégorie « keko », en tête.
 */
import * as frappeDuNiveau from './frappe-du-niveau.js'
import * as dechirure from './dechirure.js'
import * as ouverture from './ouverture.js'
import * as cryogenie from './cryogenie.js'
import * as cryogenieSol from './cryogenie-sol.js'
import * as gobelinMarche from './gobelin-marche.js'
import * as gobelinBestiole from './gobelin-bestiole.js'
import * as magicienBestiole from './magicien-bestiole.js'
import * as explosionEspace from './explosion-espace.js'

export const NOS_EFFETS: Record<string, unknown> = {
  'keko/frappe-du-niveau': frappeDuNiveau,
  'keko/dechirure': dechirure,
  'keko/ouverture': ouverture,
  'keko/cryogenie': cryogenie,
  'keko/cryogenie-sol': cryogenieSol,
  'keko/gobelin-marche': gobelinMarche,
  'keko/gobelin-bestiole': gobelinBestiole,
  'keko/magicien-bestiole': magicienBestiole,
  'keko/explosion-espace': explosionEspace,
}

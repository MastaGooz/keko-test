import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

/**
 * GitHub Pages impose `Cache-Control: max-age=600` sur le HTML et ne permet
 * pas d'y toucher. Le téléphone de Keko garde donc un vieil `index.html`, qui
 * pointe vers un vieux bundle — il teste une version périmée sans le savoir.
 *
 * On publie la date du build dans un fichier à part. La page la relit au
 * démarrage sans passer par le cache : si elle diffère, c'est que le HTML est
 * périmé et on se recharge une fois.
 */
function datePubliee() {
  return {
    name: 'date-publiee',
    generateBundle() {
      // @ts-expect-error -- `this` est le contexte du plugin Rollup.
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ build: buildTime }),
      })
    },
  }
}

/**
 * LE MANIFESTE PORTE LA DATE DU BUILD, comme toute ressource de `public/`.
 *
 * *Les fichiers de `public/` sont copiés tels quels, sans empreinte de contenu
 * dans leur nom* : leur URL ne bouge jamais, donc le navigateur ressert celle
 * qu'il a en cache. **La règle est écrite depuis les portraits du joueur** — et
 * le manifeste y échappait, alors que c'est lui qui décide de l'orientation
 * d'une application installée.
 *
 * ***ET ÇA NE SUFFIT PAS POUR UNE APP DÉJÀ INSTALLÉE***, qui garde
 * l'orientation de son installation : celle-là se corrige en la réinstallant.
 * Ce qui est corrigé ici, c'est la prochaine.
 */
function manifesteVersionne() {
  return {
    name: 'manifeste-versionne',
    transformIndexHtml(html: string) {
      return html.replace(
        'href="./manifest.webmanifest"',
        `href="./manifest.webmanifest?v=${encodeURIComponent(buildTime)}"`,
      )
    },
  }
}

export default defineConfig(({ command }) => ({
  // GitHub Pages sert le site sous /keko-test/ ; en dev on reste à la racine
  // pour que l'URL Network soit directement ouvrable sur le téléphone.
  base: command === 'build' ? '/keko-test/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    // Sans cible explicite, le minifieur réécrit `max-height: 620px` en
    // syntaxe d'intervalle (`height <= 620px`), qui demande Chrome 104+ ou
    // Safari 16.4+. Sur un téléphone plus ancien la règle serait ignorée
    // SANS ERREUR : le combat redéborderait de l'écran et rien ne le dirait.
    cssTarget: ['chrome90', 'safari14', 'firefox90'],
    // LA PAGE DE PREVIEW DU GÉNÉRATEUR est une seconde page, hors du jeu :
    // `preview.html` à côté de `index.html`, servie telle quelle par Pages.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        preview: fileURLToPath(new URL('./preview.html', import.meta.url)),
      },
    },
  },
  plugins: [react(), datePubliee(), manifesteVersionne()],
}))

import { defineConfig } from 'vite'

const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

export default defineConfig(({ command }) => ({
  // GitHub Pages sert le site sous /keko-test/ ; en dev on reste à la racine
  // pour que l'URL Network soit directement ouvrable sur le téléphone.
  base: command === 'build' ? '/keko-test/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
}))

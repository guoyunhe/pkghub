import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entry points of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entryPoints: ['resources/js/app.js'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
    react(),
  ],
  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})

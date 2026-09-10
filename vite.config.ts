import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entry points of your application. Each entrypoint will result in a separate bundle.
       */
      entryPoints: ['resources/js/index.tsx'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },
  server: {
    open: true,
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})

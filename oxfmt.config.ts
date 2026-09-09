import preset from '@guoyunhe/oxfmt-config'
import { defineConfig } from 'oxfmt'

export default defineConfig({
  ...preset,
  semi: false,
  ignorePatterns: ['.adonisjs/**', 'build/**', 'database/schema.ts', 'node_modules/**', 'tmp/**'],
})

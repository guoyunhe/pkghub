import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import './styles.css'
import './i18n'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { createRoot } from 'react-dom/client'

import App from './App'

const colorSchemeManager = localStorageColorSchemeManager({ key: 'color-scheme' })

const root = document.getElementById('root')

if (!root) {
  throw new Error('React root element was not found')
}

createRoot(root).render(
  <MantineProvider defaultColorScheme='auto' colorSchemeManager={colorSchemeManager}>
    <App />
  </MantineProvider>,
)

import '@mantine/core/styles.css';
import './styles.css';
import './i18n';
import { MantineProvider } from '@mantine/core';
import { createRoot } from 'react-dom/client';

import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('React root element was not found');
}

createRoot(root).render(
  <MantineProvider defaultColorScheme='light'>
    <App />
  </MantineProvider>,
);

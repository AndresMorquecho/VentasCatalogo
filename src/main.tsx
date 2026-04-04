import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/app/App'
import { Buffer } from 'buffer'
// @ts-ignore
window.Buffer = window.Buffer || Buffer

// Global fix to prevent mouse wheel from changing number input values
document.addEventListener('wheel', () => {
  if (document.activeElement?.getAttribute('type') === 'number') {
    (document.activeElement as HTMLElement).blur();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './styles/index.css'

// Marque la page comme pilotée par JavaScript : les blocs `[data-reveal]` ne
// sont masqués qu'à cette condition, afin que le contenu reste lisible si le
// script échoue à se charger.
document.documentElement.classList.add('js')

const container = document.getElementById('root')
if (!container) {
  throw new Error('Élément racine « #root » introuvable dans index.html')
}

createRoot(container).render(
  <StrictMode>
    {/* `BASE_URL` suit la configuration Vite : la même application fonctionne à
        la racine d'un domaine comme dans un sous-chemin GitHub Pages. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

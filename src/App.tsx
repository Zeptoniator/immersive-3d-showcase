import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Racine applicative : uniquement le routage.
 *
 * Toute la composition de la page vit dans `pages/HomePage.tsx`, et la scène
 * dans `scenes/MainScene.tsx`. Ce fichier reste volontairement minimal.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

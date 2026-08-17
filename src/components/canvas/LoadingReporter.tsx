import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useExperienceStore } from '../../store/useExperienceStore'

/**
 * Relaie la progression réelle du gestionnaire de chargement de Three.js vers
 * le store, afin que l'écran de chargement affiche une valeur mesurée.
 *
 * L'objet NOVA CORE étant procédural, aucune ressource externe n'est requise :
 * la progression est alors pilotée par les jalons d'initialisation
 * (`MainScene`). Dès qu'un fichier GLB ou une texture est ajouté, cette sonde
 * prend le relais automatiquement et affiche la progression du téléchargement.
 */
export function LoadingReporter() {
  const { progress, active } = useProgress()
  const setLoadingProgress = useExperienceStore((state) => state.setLoadingProgress)

  useEffect(() => {
    if (!active) return
    setLoadingProgress(Math.round(progress))
  }, [active, progress, setLoadingProgress])

  return null
}

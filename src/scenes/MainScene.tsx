import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraRig } from '../components/canvas/CameraRig'
import { HotspotMarkers } from '../components/canvas/HotspotMarkers'
import { LoadingReporter } from '../components/canvas/LoadingReporter'
import { NovaCore } from '../components/canvas/NovaCore'
import { ParticleField } from '../components/canvas/ParticleField'
import { QualityManager } from '../components/canvas/QualityManager'
import { SceneEnvironment } from '../components/canvas/SceneEnvironment'
import { SceneLights } from '../components/canvas/SceneLights'
import { useExperienceStore } from '../store/useExperienceStore'
import { QUALITY_PRESETS } from '../utils/quality'
import { scenePalette } from '../utils/scenePalette'

interface MainSceneProps {
  reducedMotion: boolean
}

/**
 * Composition de la scène 3D.
 *
 * Ce composant n'a qu'une responsabilité : assembler les briques et signaler
 * que la scène est prête. Toute la logique de rendu vit dans les composants
 * enfants, ce qui permet de réutiliser la scène telle quelle dans un autre
 * projet en ne remplaçant que `NovaCore`.
 */
export function MainScene({ reducedMotion }: MainSceneProps) {
  const resolvedQuality = useExperienceStore((state) => state.resolvedQuality)
  const setSceneReady = useExperienceStore((state) => state.setSceneReady)
  const setLoadingProgress = useExperienceStore((state) => state.setLoadingProgress)

  const resolvedTheme = useExperienceStore((state) => state.resolvedTheme)

  const settings = QUALITY_PRESETS[resolvedQuality]
  // Une seule source de vérité chromatique pour toute la scène.
  const palette = scenePalette(resolvedTheme)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    // À ce stade le contexte WebGL existe et la scène est montée : on peut
    // libérer l'écran de chargement.
    setLoadingProgress(100)
    const frame = requestAnimationFrame(() => setSceneReady(true))
    return () => cancelAnimationFrame(frame)
  }, [gl, setLoadingProgress, setSceneReady])

  return (
    <>
      <LoadingReporter />
      <QualityManager />
      <CameraRig reducedMotion={reducedMotion} />
      <SceneLights settings={settings} palette={palette} />
      <SceneEnvironment settings={settings} palette={palette} />
      <NovaCore settings={settings} palette={palette} reducedMotion={reducedMotion} />
      <ParticleField count={settings.particleCount} palette={palette} />
      <HotspotMarkers />
    </>
  )
}

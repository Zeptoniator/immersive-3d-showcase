import { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { MainScene } from '../../scenes/MainScene'
import { useExperienceStore } from '../../store/useExperienceStore'
import { QUALITY_PRESETS } from '../../utils/quality'
import { PRODUCT_NAME } from '../../utils/content'

interface ExperienceCanvasProps {
  reducedMotion: boolean
  /** Appelé si le contexte WebGL est perdu : la page bascule alors sur le repli. */
  onContextLost: () => void
}

/**
 * Couche 3D fixe, placée derrière le contenu HTML.
 *
 * Le conteneur est en `pointer-events: none` : la scène ne capte jamais le
 * défilement. Les interactions passent par la surface de contrôle de la section
 * Exploration et par les marqueurs, qui réactivent les événements pour eux seuls.
 */
export function ExperienceCanvas({ reducedMotion, onContextLost }: ExperienceCanvasProps) {
  const resolvedQuality = useExperienceStore((state) => state.resolvedQuality)
  const settings = QUALITY_PRESETS[resolvedQuality]

  // La boucle de rendu est suspendue quand l'onglet passe en arrière-plan :
  // inutile de consommer du GPU pour une page invisible.
  const [documentVisible, setDocumentVisible] = useState(true)

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.08
      gl.outputColorSpace = THREE.SRGBColorSpace
      if (settings.shadows) {
        gl.shadowMap.enabled = true
        // `PCFSoftShadowMap` est déprécié depuis Three r18x ; `PCFShadowMap`
        // est le filtre recommandé et suffit largement à cette échelle.
        gl.shadowMap.type = THREE.PCFShadowMap
      }

      const canvas = gl.domElement
      const handleLost = (event: Event) => {
        event.preventDefault()
        onContextLost()
      }
      canvas.addEventListener('webglcontextlost', handleLost)
    },
    [onContextLost, settings.shadows]
  )

  return (
    <div
      className="canvas-layer"
      role="img"
      aria-label={`Scène 3D interactive présentant ${PRODUCT_NAME}`}
      aria-describedby="scene-description"
      data-testid="experience-canvas"
    >
      <Canvas
        dpr={settings.dpr}
        shadows={settings.shadows}
        frameloop={documentVisible ? 'always' : 'never'}
        // Le redimensionnement n'est pas recalculé au défilement : c'est la
        // principale source de « layout thrashing » sur une page longue.
        resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
        camera={{ fov: 42, near: 0.1, far: 120, position: [0.4, 0.7, 8.4] }}
        gl={{
          antialias: settings.antialias,
          alpha: true,
          stencil: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <MainScene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  )
}

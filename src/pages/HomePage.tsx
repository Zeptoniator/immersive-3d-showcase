import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Footer } from '../components/layout/Footer'
import { HeroSection } from '../components/sections/HeroSection'
import { TechnologySection } from '../components/sections/TechnologySection'
import { InteractiveSection } from '../components/sections/InteractiveSection'
import { PerformanceSection } from '../components/sections/PerformanceSection'
import { FinalSection } from '../components/sections/FinalSection'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { LiveAnnouncer } from '../components/ui/LiveAnnouncer'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { TelemetryReadout } from '../components/ui/TelemetryReadout'
import { usePointerParallax } from '../hooks/usePointerParallax'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { useScrollChoreography } from '../hooks/useScrollChoreography'
import { useSectionObserver } from '../hooks/useSectionObserver'
import { useExperienceStore } from '../store/useExperienceStore'
import { probeWebGL } from '../utils/webgl'

/**
 * La couche 3D est chargée à la demande : Three.js et React Three Fiber
 * représentent l'essentiel du poids du site. Les visiteurs sans WebGL ne
 * téléchargent jamais ce fragment.
 */
const ExperienceCanvas = lazy(() =>
  import('../components/canvas/ExperienceCanvas').then((module) => ({
    default: module.ExperienceCanvas,
  }))
)

/**
 * Page principale.
 *
 * Elle articule deux couches indépendantes :
 *
 * - le contenu HTML, toujours rendu, qui porte l'intégralité de l'information ;
 * - la scène 3D, purement décorative et interactive, qui peut échouer sans
 *   jamais priver l'utilisateur du contenu.
 */
export function HomePage() {
  const report = useMemo(() => probeWebGL(), [])
  const [renderFailed, setRenderFailed] = useState(false)
  const [failureReason, setFailureReason] = useState<string | undefined>(report.reason)

  const reducedMotion = usePrefersReducedMotion()
  const setWebglAvailable = useExperienceStore((state) => state.setWebglAvailable)
  const setSceneReady = useExperienceStore((state) => state.setSceneReady)
  const announce = useExperienceStore((state) => state.announce)

  const use3D = report.available && !renderFailed

  useEffect(() => {
    setWebglAvailable(use3D)
    // Sans scène 3D il n'y a rien à attendre : l'écran de chargement se retire
    // immédiatement plutôt que de faire patienter inutilement.
    if (!use3D) setSceneReady(true)
  }, [setSceneReady, setWebglAvailable, use3D])

  useSectionObserver()
  useScrollChoreography(true, reducedMotion)
  // La parallaxe est désactivée en mouvement réduit et sur pointeur grossier.
  usePointerParallax(use3D && !reducedMotion)

  const handleFailure = useCallback(
    (reason: string) => {
      setFailureReason(reason)
      setRenderFailed(true)
      setSceneReady(true)
      announce('Le rendu 3D a été interrompu. Un aperçu statique le remplace.')
    },
    [announce, setSceneReady]
  )

  const handleContextLost = useCallback(
    () => handleFailure('Contexte WebGL perdu'),
    [handleFailure]
  )

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>

      <LoadingScreen />
      <LiveAnnouncer />

      {use3D ? (
        <ErrorBoundary
          onError={(error) => handleFailure(error.message)}
          // Le repli visuel est rendu par les sections HTML : la frontière ne
          // remplace la couche 3D par rien du tout, elle la retire simplement.
          fallback={() => null}
        >
          <Suspense fallback={null}>
            <ExperienceCanvas reducedMotion={reducedMotion} onContextLost={handleContextLost} />
          </Suspense>
        </ErrorBoundary>
      ) : null}

      <div className="content-layer">
        <SiteHeader />

        <main id="main-content">
          <HeroSection webglAvailable={use3D} fallbackReason={failureReason} />
          <TechnologySection />
          <InteractiveSection />
          <PerformanceSection />
          <FinalSection />
        </main>

        <Footer />
      </div>

      <TelemetryReadout />
    </div>
  )
}

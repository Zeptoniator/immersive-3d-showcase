import { useEffect, useRef, useState } from 'react'
import { useExperienceStore } from '../../store/useExperienceStore'
import { PRODUCT_NAME } from '../../utils/content'
import { clamp } from '../../utils/math'

/** Au-delà de ce délai, l'écran s'efface quoi qu'il arrive (en millisecondes). */
const SAFETY_TIMEOUT = 6000
/** Durée de la transition de sortie, alignée sur `--duration-slow`. */
const EXIT_DURATION = 520
/** Plafond de la progression simulée : seule la scène réelle atteint 100 %. */
const SIMULATION_CEILING = 92

const STATUS_STEPS: ReadonlyArray<{ upTo: number; label: string }> = [
  { upTo: 25, label: 'Initialisation du contexte graphique' },
  { upTo: 55, label: 'Compilation des matériaux' },
  { upTo: 85, label: 'Assemblage de la structure' },
  { upTo: 99, label: 'Calibrage de la caméra' },
  { upTo: 100, label: 'Prêt' },
]

function statusFor(progress: number): string {
  return STATUS_STEPS.find((step) => progress <= step.upTo)?.label ?? 'Prêt'
}

/**
 * Écran de chargement.
 *
 * La valeur affichée est dérivée, jamais recopiée : elle combine la progression
 * réelle poussée dans le store (gestionnaire de chargement de Three.js, jalons
 * d'initialisation de la scène) et une avance minimale simulée pour que la
 * barre ne reste jamais figée à zéro. Un délai de sécurité garantit que l'écran
 * disparaît même si une ressource échoue à se charger.
 */
export function LoadingScreen() {
  const loadingProgress = useExperienceStore((state) => state.loadingProgress)
  const sceneReady = useExperienceStore((state) => state.sceneReady)
  const setSceneReady = useExperienceStore((state) => state.setSceneReady)

  const [simulated, setSimulated] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [hidden, setHidden] = useState(false)
  const startedAt = useRef<number | null>(null)

  // Avance minimale, calculée dans un rappel de minuterie : la scène peut
  // mettre un instant à compiler ses shaders sans qu'aucun événement de
  // chargement ne soit émis.
  useEffect(() => {
    if (sceneReady) return

    startedAt.current ??= Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - (startedAt.current ?? Date.now())
      setSimulated(clamp((elapsed / 1400) * SIMULATION_CEILING, 0, SIMULATION_CEILING))
    }, 90)

    return () => window.clearInterval(interval)
  }, [sceneReady])

  // Filet de sécurité : une ressource bloquée ne doit pas piéger l'utilisateur.
  useEffect(() => {
    const timeout = window.setTimeout(() => setSceneReady(true), SAFETY_TIMEOUT)
    return () => window.clearTimeout(timeout)
  }, [setSceneReady])

  // Séquence de sortie, entièrement pilotée par des minuteries.
  useEffect(() => {
    if (!sceneReady) return
    const exitTimer = window.setTimeout(() => setExiting(true), 180)
    const hideTimer = window.setTimeout(() => setHidden(true), 180 + EXIT_DURATION)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [sceneReady])

  if (hidden) return null

  const displayed = sceneReady ? 100 : Math.max(simulated, loadingProgress)
  const rounded = Math.round(displayed)

  return (
    <div
      className="loading-screen"
      data-exiting={exiting}
      data-testid="loading-screen"
      role="status"
      aria-live="polite"
      // Une fois la sortie amorcée, l'écran ne doit plus être annoncé ni
      // intercepter le focus.
      aria-hidden={exiting}
    >
      <p className="loading-screen__title">{PRODUCT_NAME}</p>

      <div
        className="loading-screen__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-label="Chargement de l'expérience 3D"
      >
        <div
          className="loading-screen__fill"
          style={{ transform: `scaleX(${clamp(displayed, 0, 100) / 100})` }}
        />
      </div>

      <p className="loading-screen__status">
        {statusFor(rounded)} — {rounded} %
      </p>
    </div>
  )
}

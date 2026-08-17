/**
 * Détection de WebGL et diagnostic du contexte graphique.
 *
 * La détection est volontairement défensive : certains environnements
 * (jsdom, navigateurs avec accélération désactivée, machines virtuelles sans
 * pilote GL) lèvent une exception plutôt que de renvoyer `null`.
 */

export interface WebGLReport {
  available: boolean
  /** `2` pour WebGL2, `1` pour WebGL1, `0` si indisponible. */
  version: 0 | 1 | 2
  /** Renderer non masqué lorsque l'extension de debug est exposée. */
  renderer: string | null
  reason?: string
}

function createProbeContext(): { gl: WebGLRenderingContext | null; version: 0 | 1 | 2 } {
  const canvas = document.createElement('canvas')
  const attributes: WebGLContextAttributes = { failIfMajorPerformanceCaveat: false, depth: false }

  const gl2 = canvas.getContext('webgl2', attributes)
  if (gl2) return { gl: gl2 as unknown as WebGLRenderingContext, version: 2 }

  const gl1 = canvas.getContext('webgl', attributes)
  if (gl1) return { gl: gl1, version: 1 }

  return { gl: null, version: 0 }
}

/** Analyse complète du support WebGL, sans jamais lever d'exception. */
export function probeWebGL(): WebGLReport {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return { available: false, version: 0, renderer: null, reason: 'no-dom' }
  }

  try {
    const { gl, version } = createProbeContext()
    if (!gl || version === 0) {
      return {
        available: false,
        version: 0,
        renderer: null,
        reason: 'context-creation-failed',
      }
    }

    let renderer: string | null = null
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const value: unknown = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      renderer = typeof value === 'string' ? value : null
    }

    // Le contexte de test est libéré immédiatement : les navigateurs limitent
    // le nombre de contextes WebGL simultanés (souvent 8 à 16).
    gl.getExtension('WEBGL_lose_context')?.loseContext()

    return { available: true, version, renderer }
  } catch (error) {
    return {
      available: false,
      version: 0,
      renderer: null,
      reason: error instanceof Error ? error.message : 'unknown-error',
    }
  }
}

/** Raccourci booléen sur {@link probeWebGL}. */
export function isWebGLAvailable(): boolean {
  return probeWebGL().available
}

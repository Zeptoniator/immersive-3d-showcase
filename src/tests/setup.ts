import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { useExperienceStore } from '../store/useExperienceStore'
import { resetScrollState } from '../store/scrollState'

/**
 * Environnement de test.
 *
 * jsdom n'implémente ni WebGL, ni `matchMedia`, ni les observateurs
 * d'intersection et de redimensionnement. On fournit des doubles minimalistes
 * plutôt que de contourner les composants : les tests exercent ainsi le vrai
 * code, y compris le chemin de repli sans WebGL.
 */

/** État initial du store, capturé avant tout test. */
const initialStoreState = useExperienceStore.getState()

// --- matchMedia ------------------------------------------------------------
/** Liste des requêtes média considérées comme actives pendant un test. */
let matchingQueries: string[] = []

/** Force une media query à correspondre (`prefers-reduced-motion`, etc.). */
export function setMatchingMediaQueries(queries: string[]): void {
  matchingQueries = queries
}

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: matchingQueries.some((candidate) => query.includes(candidate)),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
)

// --- Observateurs ----------------------------------------------------------
class MockObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds: number[] = []
}

vi.stubGlobal('IntersectionObserver', MockObserver)
vi.stubGlobal('ResizeObserver', MockObserver)

// --- WebGL -----------------------------------------------------------------
/**
 * jsdom lève « Not implemented » sur `getContext`. On renvoie `null` par
 * défaut : la détection conclut donc à l'absence de WebGL, ce qui est le
 * comportement attendu dans cet environnement et permet de tester réellement
 * le repli.
 */
let webglContextFactory: (() => unknown) | null = null

/** Simule un contexte WebGL disponible pour la durée d'un test. */
export function enableFakeWebGL(): void {
  webglContextFactory = () => ({
    getExtension: () => null,
    getParameter: () => 'Fake Renderer',
  })
}

/** Rétablit l'absence de WebGL. */
export function disableFakeWebGL(): void {
  webglContextFactory = null
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: vi.fn((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'webgl2') {
      return webglContextFactory ? webglContextFactory() : null
    }
    return null
  }),
})

// --- Réinitialisation entre les tests --------------------------------------
beforeEach(() => {
  matchingQueries = []
  disableFakeWebGL()
  window.localStorage.clear()
  useExperienceStore.setState(initialStoreState, true)
  resetScrollState()
})

afterEach(() => {
  cleanup()
})

import { create } from 'zustand'
import type { QualityLevel, QualityPreference, SectionId } from '../types'
import { loadStoredPreference, storePreference } from '../utils/quality'
import {
  documentTheme,
  loadStoredTheme,
  resolveTheme,
  storeTheme,
  type Theme,
  type ThemePreference,
} from '../utils/theme'

/**
 * État réellement partagé de l'expérience.
 *
 * Volontairement restreint : tout ce qui change à chaque image (progression du
 * défilement, position de caméra, phase des animations) est tenu hors de React
 * dans `scrollState.ts` pour ne pas déclencher de rendu 60 fois par seconde.
 */
interface ExperienceState {
  /** La scène 3D a fini de s'initialiser (ou le repli HTML est en place). */
  sceneReady: boolean
  /** Progression du chargement, de 0 à 100. */
  loadingProgress: number
  /** Section actuellement visible, pour la navigation et le fil d'ariane. */
  activeSection: SectionId
  /** Choix de thème de l'utilisateur (`auto` suit le système). */
  themePreference: ThemePreference
  /** Thème effectivement appliqué, après arbitrage. */
  resolvedTheme: Theme
  /** Choix explicite de l'utilisateur (`auto` par défaut). */
  qualityPreference: QualityPreference
  /** Niveau effectivement appliqué, après arbitrage automatique. */
  resolvedQuality: QualityLevel
  /** Les animations automatiques (rotations, pulsations) sont suspendues. */
  animationsPaused: boolean
  /** Point d'intérêt sélectionné, ou `null`. */
  selectedHotspotId: string | null
  /** L'utilisateur a manipulé la scène au moins une fois. */
  hasInteracted: boolean
  /** WebGL est utilisable ; `null` tant que la détection n'a pas eu lieu. */
  webglAvailable: boolean | null
  /** Message destiné à la zone d'annonce discrète (aria-live). */
  announcement: string

  setSceneReady: (ready: boolean) => void
  setLoadingProgress: (progress: number) => void
  setActiveSection: (section: SectionId) => void
  setThemePreference: (preference: ThemePreference) => void
  setResolvedTheme: (theme: Theme) => void
  setQualityPreference: (preference: QualityPreference) => void
  setResolvedQuality: (level: QualityLevel) => void
  toggleAnimations: () => void
  setAnimationsPaused: (paused: boolean) => void
  selectHotspot: (id: string | null) => void
  markInteracted: () => void
  setWebglAvailable: (available: boolean) => void
  announce: (message: string) => void
  /** Remet l'expérience dans son état initial (bouton « Recommencer »). */
  resetExperience: () => void
}

const initialPreference: QualityPreference =
  typeof window === 'undefined' ? 'auto' : (loadStoredPreference() ?? 'auto')

const initialThemePreference: ThemePreference =
  typeof window === 'undefined' ? 'auto' : (loadStoredTheme() ?? 'auto')

export const useExperienceStore = create<ExperienceState>((set) => ({
  sceneReady: false,
  loadingProgress: 0,
  activeSection: 'hero',
  themePreference: initialThemePreference,
  // En mode automatique, on part du thème que le script d'amorçage a déjà
  // posé sur `<html>` plutôt que d'interroger `matchMedia` une seconde fois.
  resolvedTheme:
    initialThemePreference === 'auto'
      ? (documentTheme() ?? resolveTheme('auto'))
      : initialThemePreference,
  qualityPreference: initialPreference,
  resolvedQuality: 'high',
  animationsPaused: false,
  selectedHotspotId: null,
  hasInteracted: false,
  webglAvailable: null,
  announcement: '',

  setSceneReady: (sceneReady) => set({ sceneReady }),

  setLoadingProgress: (loadingProgress) =>
    // La progression ne doit jamais régresser : plusieurs sources l'alimentent.
    set((state) => ({ loadingProgress: Math.max(state.loadingProgress, loadingProgress) })),

  setActiveSection: (activeSection) => set({ activeSection }),

  setThemePreference: (themePreference) => {
    storeTheme(themePreference)
    set({ themePreference, resolvedTheme: resolveTheme(themePreference) })
  },

  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

  setQualityPreference: (qualityPreference) => {
    storePreference(qualityPreference)
    set({ qualityPreference })
  },

  setResolvedQuality: (resolvedQuality) => set({ resolvedQuality }),

  toggleAnimations: () => set((state) => ({ animationsPaused: !state.animationsPaused })),

  setAnimationsPaused: (animationsPaused) => set({ animationsPaused }),

  selectHotspot: (selectedHotspotId) => set({ selectedHotspotId, hasInteracted: true }),

  markInteracted: () => set({ hasInteracted: true }),

  setWebglAvailable: (webglAvailable) => set({ webglAvailable }),

  announce: (announcement) => set({ announcement }),

  resetExperience: () =>
    set({
      activeSection: 'hero',
      selectedHotspotId: null,
      animationsPaused: false,
      hasInteracted: false,
      announcement: '',
    }),
}))

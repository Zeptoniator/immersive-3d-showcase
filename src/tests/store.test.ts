import { describe, expect, it } from 'vitest'
import { useExperienceStore } from '../store/useExperienceStore'
import { QUALITY_STORAGE_KEY } from '../utils/quality'

describe('useExperienceStore', () => {
  it('démarre sur un état neutre', () => {
    const state = useExperienceStore.getState()
    expect(state.sceneReady).toBe(false)
    expect(state.activeSection).toBe('hero')
    expect(state.selectedHotspotId).toBeNull()
    expect(state.animationsPaused).toBe(false)
    expect(state.qualityPreference).toBe('auto')
  })

  it('ne fait jamais régresser la progression de chargement', () => {
    const { setLoadingProgress } = useExperienceStore.getState()
    setLoadingProgress(60)
    setLoadingProgress(20)
    expect(useExperienceStore.getState().loadingProgress).toBe(60)
  })

  it('persiste la préférence de qualité choisie', () => {
    useExperienceStore.getState().setQualityPreference('medium')
    expect(useExperienceStore.getState().qualityPreference).toBe('medium')
    expect(window.localStorage.getItem(QUALITY_STORAGE_KEY)).toBe('medium')
  })

  it('marque une interaction lors de la sélection d’un point d’intérêt', () => {
    useExperienceStore.getState().selectHotspot('rings')
    const state = useExperienceStore.getState()
    expect(state.selectedHotspotId).toBe('rings')
    expect(state.hasInteracted).toBe(true)
  })

  it('bascule la pause des animations', () => {
    const { toggleAnimations } = useExperienceStore.getState()
    toggleAnimations()
    expect(useExperienceStore.getState().animationsPaused).toBe(true)
    toggleAnimations()
    expect(useExperienceStore.getState().animationsPaused).toBe(false)
  })

  it('réinitialise l’expérience sans effacer la préférence de qualité', () => {
    const store = useExperienceStore.getState()
    store.setQualityPreference('low')
    store.selectHotspot('core')
    store.setAnimationsPaused(true)
    store.setActiveSection('performance')

    useExperienceStore.getState().resetExperience()

    const state = useExperienceStore.getState()
    expect(state.selectedHotspotId).toBeNull()
    expect(state.animationsPaused).toBe(false)
    expect(state.activeSection).toBe('hero')
    // La préférence est un réglage de l'appareil, pas un état d'expérience.
    expect(state.qualityPreference).toBe('low')
  })
})

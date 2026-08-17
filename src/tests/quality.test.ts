import { describe, expect, it } from 'vitest'
import {
  QUALITY_PRESETS,
  QUALITY_STORAGE_KEY,
  degradeQuality,
  detectQualityLevel,
  loadStoredPreference,
  storePreference,
  type DeviceSignals,
} from '../utils/quality'

const desktopSignals: DeviceSignals = {
  viewportWidth: 1920,
  devicePixelRatio: 1,
  hardwareConcurrency: 8,
  deviceMemory: 16,
  prefersReducedMotion: false,
  coarsePointer: false,
}

describe('detectQualityLevel', () => {
  it('retient la qualité élevée sur un poste de travail confortable', () => {
    expect(detectQualityLevel(desktopSignals)).toBe('high')
  })

  it('rétrograde sur un petit écran tactile à fort ratio de pixels', () => {
    expect(
      detectQualityLevel({
        ...desktopSignals,
        viewportWidth: 390,
        devicePixelRatio: 3,
        hardwareConcurrency: 4,
        deviceMemory: 4,
        coarsePointer: true,
      })
    ).toBe('low')
  })

  it('ne rétrograde pas un téléphone haut de gamme au niveau le plus bas', () => {
    // Cas mesuré sur un Samsung SM-S948B : écran étroit et ratio de pixels
    // élevé, mais huit cœurs et un affichage à 120 Hz. Le classer « faible »
    // serait un gâchis, et c'est la surveillance de la fluidité — pas
    // l'heuristique initiale — qui doit trancher si la scène rame vraiment.
    expect(
      detectQualityLevel({
        ...desktopSignals,
        viewportWidth: 412,
        devicePixelRatio: 3.4,
        hardwareConcurrency: 8,
        deviceMemory: 8,
        coarsePointer: true,
      })
    ).toBe('medium')
  })

  it('choisit un niveau intermédiaire sur une tablette', () => {
    expect(
      detectQualityLevel({
        ...desktopSignals,
        viewportWidth: 900,
        devicePixelRatio: 2,
        hardwareConcurrency: 8,
        deviceMemory: 8,
        coarsePointer: true,
      })
    ).toBe('medium')
  })

  it('tient compte de la préférence de réduction des animations', () => {
    // Sur une machine puissante, la préférence ne suffit pas à rétrograder :
    // elle traduit un besoin de sobriété visuelle, pas une contrainte matérielle.
    expect(detectQualityLevel({ ...desktopSignals, prefersReducedMotion: true })).toBe('high')

    // En revanche elle fait basculer une configuration déjà limite.
    const borderline: DeviceSignals = {
      ...desktopSignals,
      viewportWidth: 900,
      devicePixelRatio: 2,
      deviceMemory: 8,
    }
    expect(detectQualityLevel(borderline)).toBe('high')
    expect(detectQualityLevel({ ...borderline, prefersReducedMotion: true })).toBe('medium')
  })

  it('ignore une mémoire non exposée par le navigateur sans se dégrader', () => {
    expect(detectQualityLevel({ ...desktopSignals, deviceMemory: null })).toBe('high')
  })
})

describe('QUALITY_PRESETS', () => {
  it('réduit progressivement chaque poste de coût', () => {
    const { high, medium, low } = QUALITY_PRESETS

    expect(high.particleCount).toBeGreaterThan(medium.particleCount)
    expect(medium.particleCount).toBeGreaterThan(low.particleCount)

    expect(high.dpr[1]).toBeGreaterThan(medium.dpr[1])
    expect(medium.dpr[1]).toBeGreaterThan(low.dpr[1])

    expect(high.shadowMapSize).toBeGreaterThan(medium.shadowMapSize)
    expect(low.shadows).toBe(false)
    expect(low.glow).toBe(false)
    expect(low.environmentReflections).toBe(false)

    expect(high.geometryDetail).toBeGreaterThan(low.geometryDetail)
  })
})

describe('degradeQuality', () => {
  it('descend d’un cran sans jamais passer sous le niveau faible', () => {
    expect(degradeQuality('high')).toBe('medium')
    expect(degradeQuality('medium')).toBe('low')
    expect(degradeQuality('low')).toBe('low')
  })
})

describe('mémorisation de la préférence', () => {
  it('enregistre et relit le choix de l’utilisateur', () => {
    storePreference('low')
    expect(window.localStorage.getItem(QUALITY_STORAGE_KEY)).toBe('low')
    expect(loadStoredPreference()).toBe('low')
  })

  it('ignore une valeur corrompue', () => {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, 'ultra')
    expect(loadStoredPreference()).toBeNull()
  })

  it('ne renvoie rien quand aucun choix n’a été fait', () => {
    expect(loadStoredPreference()).toBeNull()
  })
})

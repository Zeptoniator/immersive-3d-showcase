import type { QualityLevel, QualityPreference, QualitySettings } from '../types'

export const QUALITY_STORAGE_KEY = 'nova-core:quality-preference'

/** Réglages concrets associés à chaque niveau de qualité. */
export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    dpr: [1, 2],
    particleCount: 2200,
    shadows: true,
    shadowMapSize: 1024,
    geometryDetail: 3,
    glow: true,
    antialias: true,
    environmentReflections: true,
  },
  medium: {
    dpr: [1, 1.5],
    particleCount: 900,
    shadows: true,
    shadowMapSize: 512,
    geometryDetail: 2,
    glow: true,
    antialias: true,
    environmentReflections: true,
  },
  low: {
    dpr: [0.75, 1],
    particleCount: 300,
    shadows: false,
    shadowMapSize: 256,
    geometryDetail: 1,
    glow: false,
    antialias: false,
    environmentReflections: false,
  },
}

export const QUALITY_LABELS: Record<QualityPreference, string> = {
  auto: 'Automatique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
}

/** Signaux mesurés servant à choisir un niveau de qualité. */
export interface DeviceSignals {
  viewportWidth: number
  devicePixelRatio: number
  hardwareConcurrency: number
  /** Mémoire approximative en Go, si le navigateur l'expose. */
  deviceMemory: number | null
  prefersReducedMotion: boolean
  /** Pointeur grossier = tactile : indicateur d'appareil mobile fiable. */
  coarsePointer: boolean
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

/** Relève les signaux matériels et de préférence disponibles côté navigateur. */
export function readDeviceSignals(): DeviceSignals {
  if (typeof window === 'undefined') {
    return {
      viewportWidth: 1280,
      devicePixelRatio: 1,
      hardwareConcurrency: 4,
      deviceMemory: null,
      prefersReducedMotion: false,
      coarsePointer: false,
    }
  }

  const nav = window.navigator as NavigatorWithMemory
  const matches = (query: string) =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false

  return {
    viewportWidth: window.innerWidth || 1280,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: nav.hardwareConcurrency ?? 4,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    prefersReducedMotion: matches('(prefers-reduced-motion: reduce)'),
    coarsePointer: matches('(pointer: coarse)'),
  }
}

/**
 * Choisit un niveau de qualité à partir de signaux mesurés.
 *
 * L'approche est cumulative : chaque signal défavorable retire des points.
 * On évite volontairement toute lecture du user-agent, peu fiable et facilement
 * usurpée.
 */
export function detectQualityLevel(signals: DeviceSignals): QualityLevel {
  let score = 100

  // Un petit écran coûte cher en remplissage, mais un téléphone récent reste
  // parfaitement capable : les pénalités de format restent mesurées, et c'est
  // la surveillance de la fluidité qui tranche ensuite les cas réels.
  if (signals.viewportWidth < 480) score -= 25
  else if (signals.viewportWidth < 768) score -= 18
  else if (signals.viewportWidth < 1024) score -= 12

  if (signals.coarsePointer) score -= 10

  if (signals.devicePixelRatio >= 3) score -= 10
  else if (signals.devicePixelRatio >= 2) score -= 8

  if (signals.hardwareConcurrency <= 2) score -= 30
  else if (signals.hardwareConcurrency <= 4) score -= 15

  if (signals.deviceMemory !== null) {
    if (signals.deviceMemory <= 2) score -= 30
    else if (signals.deviceMemory <= 4) score -= 15
  }

  // Le mode « mouvement réduit » traduit souvent un besoin de sobriété
  // (confort visuel, batterie, matériel modeste).
  if (signals.prefersReducedMotion) score -= 20

  if (score >= 75) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/** Rétrograde d'un cran (`high` → `medium` → `low`). */
export function degradeQuality(level: QualityLevel): QualityLevel {
  if (level === 'high') return 'medium'
  if (level === 'medium') return 'low'
  return 'low'
}

/** Lit la préférence enregistrée localement, en tolérant un stockage indisponible. */
export function loadStoredPreference(): QualityPreference | null {
  try {
    const raw = window.localStorage.getItem(QUALITY_STORAGE_KEY)
    if (raw === 'auto' || raw === 'high' || raw === 'medium' || raw === 'low') return raw
    return null
  } catch {
    // Mode navigation privée ou stockage bloqué : on ignore silencieusement.
    return null
  }
}

/** Enregistre la préférence localement, sans faire échouer l'application. */
export function storePreference(preference: QualityPreference): void {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, preference)
  } catch {
    // Stockage indisponible : la préférence restera valable pour la session.
  }
}

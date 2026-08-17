/** Thème effectivement appliqué à la page. */
export type Theme = 'light' | 'dark'

/** Choix de l'utilisateur : `auto` suit la préférence du système. */
export type ThemePreference = Theme | 'auto'

export const THEME_STORAGE_KEY = 'nova-core:theme-preference'

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: 'Système',
  light: 'Clair',
  dark: 'Sombre',
}

/** Couleur de la barre d'adresse mobile, par thème. */
export const THEME_COLORS: Record<Theme, string> = {
  dark: '#04060e',
  light: '#eef2f9',
}

/** Thème demandé par le système d'exploitation. */
export function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Résout la préférence en thème concret. */
export function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'auto' ? systemTheme() : preference
}

/** Lit la préférence enregistrée, en tolérant un stockage indisponible. */
export function loadStoredTheme(): ThemePreference | null {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'auto' || raw === 'light' || raw === 'dark') return raw
    return null
  } catch {
    // Navigation privée ou stockage bloqué : la préférence vaudra pour la session.
    return null
  }
}

/** Enregistre la préférence, sans jamais faire échouer l'application. */
export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Stockage indisponible : on n'insiste pas.
  }
}

/**
 * Applique le thème au document.
 *
 * `data-theme` pilote la totalité des jetons CSS ; `color-scheme` accorde les
 * éléments natifs du navigateur (barres de défilement, champs de formulaire) ;
 * `theme-color` met la barre d'adresse mobile à la même teinte que la page.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme])
}

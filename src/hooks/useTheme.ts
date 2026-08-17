import { useEffect } from 'react'
import { useExperienceStore } from '../store/useExperienceStore'
import { applyTheme, systemTheme } from '../utils/theme'

/**
 * Applique le thème au document et suit les changements du système.
 *
 * Le thème est appliqué une première fois par un script en tête de
 * `index.html`, avant le premier rendu, pour éviter tout clignotement. Ce hook
 * prend ensuite le relais : il répercute les changements de préférence et, en
 * mode `auto`, réagit à un basculement clair/sombre du système d'exploitation
 * pendant que la page est ouverte.
 */
export function useTheme(): void {
  const themePreference = useExperienceStore((state) => state.themePreference)
  const resolvedTheme = useExperienceStore((state) => state.resolvedTheme)
  const setResolvedTheme = useExperienceStore((state) => state.setResolvedTheme)

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  useEffect(() => {
    if (themePreference !== 'auto') return
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setResolvedTheme(systemTheme())

    // Le système peut basculer en cours de session (thème programmé le soir).
    onChange()
    query.addEventListener('change', onChange)

    /*
     * Relecture différée.
     *
     * Certains environnements — mesuré dans une WebView Android — ne
     * renvoient la bonne valeur de `prefers-color-scheme` qu'une fois le
     * premier rendu passé, et n'émettent pas d'événement `change` pour cette
     * mise au point. Sans cette relecture, la page reste bloquée sur le thème
     * erroné jusqu'à un vrai changement système.
     */
    const settle = window.setTimeout(onChange, 800)

    return () => {
      window.clearTimeout(settle)
      query.removeEventListener('change', onChange)
    }
  }, [themePreference, setResolvedTheme])
}

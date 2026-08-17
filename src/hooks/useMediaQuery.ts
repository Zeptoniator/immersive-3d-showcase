import { useCallback, useSyncExternalStore } from 'react'

/**
 * Suit une media query et réagit à ses changements.
 *
 * L'implémentation repose sur `useSyncExternalStore` : c'est exactement le cas
 * d'usage pour lequel ce hook existe — une source de vérité extérieure à React.
 * On évite ainsi tout `setState` dans un effet, donc tout rendu en cascade.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
      }
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onStoreChange)
      return () => mediaQueryList.removeEventListener('change', onStoreChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  }, [query])

  // Le rendu serveur n'est pas utilisé ici, mais fournir un instantané côté
  // serveur évite toute divergence si un pré-rendu était ajouté plus tard.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** L'utilisateur a demandé une réduction des animations au niveau du système. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** L'utilisateur a demandé un contraste renforcé. */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)')
}

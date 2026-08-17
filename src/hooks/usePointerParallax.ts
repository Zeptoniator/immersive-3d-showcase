import { useEffect } from 'react'
import { scrollState } from '../store/scrollState'
import { clamp } from '../utils/math'

/**
 * Alimente `scrollState.pointerX/Y` à partir du pointeur, pour la parallaxe de
 * caméra.
 *
 * L'écriture se fait dans un objet mutable : aucun rendu React n'est provoqué.
 * L'écouteur est passif afin de ne jamais retarder le défilement.
 *
 * @param enabled désactive la parallaxe (mouvement réduit, appareil tactile)
 */
export function usePointerParallax(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      scrollState.pointerX = 0
      scrollState.pointerY = 0
      return
    }

    const onPointerMove = (event: PointerEvent) => {
      // Seule la souris pilote la parallaxe : au doigt, le contact sert au
      // défilement et à l'orbite, pas au recentrage permanent de la caméra.
      if (event.pointerType !== 'mouse') return
      const { innerWidth, innerHeight } = window
      if (innerWidth === 0 || innerHeight === 0) return
      scrollState.pointerX = clamp((event.clientX / innerWidth) * 2 - 1, -1, 1)
      scrollState.pointerY = clamp((event.clientY / innerHeight) * 2 - 1, -1, 1)
    }

    const onPointerLeave = () => {
      scrollState.pointerX = 0
      scrollState.pointerY = 0
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      scrollState.pointerX = 0
      scrollState.pointerY = 0
    }
  }, [enabled])
}

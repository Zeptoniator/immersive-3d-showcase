import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { useExperienceStore } from '../store/useExperienceStore'

describe('LoadingScreen', () => {
  it('affiche le nom du produit et une barre de progression accessible', () => {
    render(<LoadingScreen />)

    expect(screen.getByText('NOVA CORE')).toBeInTheDocument()
    const bar = screen.getByRole('progressbar', { name: /chargement/i })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('reflète la progression poussée dans le store', async () => {
    render(<LoadingScreen />)

    act(() => {
      useExperienceStore.getState().setLoadingProgress(42)
    })

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
    })
  })

  it('s’efface une fois la scène prête', async () => {
    render(<LoadingScreen />)
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument()

    act(() => {
      useExperienceStore.getState().setSceneReady(true)
    })

    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('ne bloque jamais l’utilisateur si aucune ressource ne se charge', () => {
    vi.useFakeTimers()
    try {
      render(<LoadingScreen />)
      expect(useExperienceStore.getState().sceneReady).toBe(false)

      // Le filet de sécurité libère l'écran au bout de six secondes.
      act(() => {
        vi.advanceTimersByTime(6100)
      })
      expect(useExperienceStore.getState().sceneReady).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

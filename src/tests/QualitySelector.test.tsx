import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QualitySelector } from '../components/ui/QualitySelector'
import { useExperienceStore } from '../store/useExperienceStore'
import { QUALITY_STORAGE_KEY } from '../utils/quality'

describe('QualitySelector', () => {
  it('expose les quatre choix avec des noms accessibles', () => {
    render(<QualitySelector />)
    const group = screen.getByRole('group', { name: /qualité/i })
    expect(group).toBeInTheDocument()

    for (const label of ['Automatique', 'Élevée', 'Moyenne', 'Faible']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marque « Automatique » comme actif au premier chargement', () => {
    render(<QualitySelector />)
    expect(screen.getByRole('button', { name: 'Automatique' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('applique le choix manuel et le mémorise localement', async () => {
    const user = userEvent.setup()
    render(<QualitySelector />)

    await user.click(screen.getByRole('button', { name: 'Faible' }))

    expect(screen.getByRole('button', { name: 'Faible' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Automatique' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(useExperienceStore.getState().qualityPreference).toBe('low')
    expect(window.localStorage.getItem(QUALITY_STORAGE_KEY)).toBe('low')
  })

  it('annonce le changement de qualité aux technologies d’assistance', async () => {
    const user = userEvent.setup()
    render(<QualitySelector />)

    await user.click(screen.getByRole('button', { name: 'Moyenne' }))
    expect(useExperienceStore.getState().announcement).toMatch(/moyenne/i)
  })

  it('n’affiche le niveau appliqué qu’en mode automatique', async () => {
    const user = userEvent.setup()
    render(<QualitySelector />)

    expect(screen.getByTestId('quality-resolved')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Élevée' }))
    expect(screen.queryByTestId('quality-resolved')).not.toBeInTheDocument()
  })

  it('est navigable au clavier', async () => {
    const user = userEvent.setup()
    render(<QualitySelector />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Automatique' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Élevée' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(useExperienceStore.getState().qualityPreference).toBe('high')
  })
})

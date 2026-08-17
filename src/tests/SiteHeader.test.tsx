import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useExperienceStore } from '../store/useExperienceStore'
import { setMatchingMediaQueries } from './setup'
import { SECTIONS } from '../utils/content'

describe('SiteHeader', () => {
  it('expose une navigation nommée contenant toutes les sections', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('navigation', { name: /navigation principale/i })).toBeInTheDocument()

    for (const section of SECTIONS) {
      const link = screen.getByRole('link', { name: section.label })
      expect(link).toHaveAttribute('href', `#${section.id}`)
    }
  })

  it('marque la section courante avec aria-current', () => {
    useExperienceStore.setState({ activeSection: 'interactive' })
    render(<SiteHeader />)
    expect(screen.getByTestId('nav-link-interactive')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('nav-link-hero')).toHaveAttribute('aria-current', 'false')
  })

  it('laisse la liste visible sur grand écran', () => {
    render(<SiteHeader />)
    expect(screen.getByTestId('nav-list')).toBeVisible()
    expect(screen.getByTestId('nav-toggle')).toHaveAttribute('aria-expanded', 'false')
  })

  it('ouvre et ferme le menu compact sur petit écran', async () => {
    setMatchingMediaQueries(['max-width: 47.99em'])
    const user = userEvent.setup()
    render(<SiteHeader />)

    const toggle = screen.getByTestId('nav-toggle')
    expect(screen.getByTestId('nav-list')).not.toBeVisible()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('nav-list')).toBeVisible()

    await user.click(screen.getByTestId('nav-link-technology'))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('ferme le menu compact avec la touche Échap', async () => {
    setMatchingMediaQueries(['max-width: 47.99em'])
    const user = userEvent.setup()
    render(<SiteHeader />)

    await user.click(screen.getByTestId('nav-toggle'))
    await user.keyboard('{Escape}')
    expect(screen.getByTestId('nav-toggle')).toHaveAttribute('aria-expanded', 'false')
  })

  it('relie le bouton au menu par aria-controls', () => {
    render(<SiteHeader />)
    const toggle = screen.getByTestId('nav-toggle')
    expect(toggle.getAttribute('aria-controls')).toBe(screen.getByTestId('nav-list').id)
  })
})

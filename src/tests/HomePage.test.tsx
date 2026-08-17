import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HomePage } from '../pages/HomePage'
import { useExperienceStore } from '../store/useExperienceStore'
import { scrollState } from '../store/scrollState'
import { setMatchingMediaQueries } from './setup'

describe('HomePage — structure et contenu', () => {
  it('rend toutes les sections essentielles', () => {
    render(<HomePage />)

    for (const id of ['hero', 'technology', 'interactive', 'performance', 'final']) {
      expect(document.getElementById(id)).toBeInTheDocument()
    }
  })

  it('respecte une hiérarchie de titres cohérente', () => {
    render(<HomePage />)

    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent(/architecture/i)

    const h2 = screen.getAllByRole('heading', { level: 2 })
    expect(h2.length).toBeGreaterThanOrEqual(4)
  })

  it('fournit un lien d’évitement vers le contenu principal', () => {
    render(<HomePage />)
    const skip = screen.getByRole('link', { name: /aller au contenu principal/i })
    expect(skip).toHaveAttribute('href', '#main-content')
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('expose les trois caractéristiques technologiques', () => {
    render(<HomePage />)
    expect(screen.getByTestId('feature-adaptive-power')).toHaveTextContent('Puissance adaptative')
    expect(screen.getByTestId('feature-light-architecture')).toHaveTextContent(
      'Architecture lumineuse'
    )
    expect(screen.getByTestId('feature-smart-control')).toHaveTextContent('Contrôle intelligent')
  })

  it('signale explicitement le caractère démonstratif des indicateurs', () => {
    render(<HomePage />)
    const disclaimer = screen.getByText(/Indicateurs fournis à titre de démonstration/i)
    expect(disclaimer).toHaveTextContent(/produit fictif/i)
    expect(disclaimer).toHaveTextContent(/ne constituent pas des caractéristiques commerciales/i)
  })

  it('fournit une description textuelle de la scène 3D', () => {
    render(<HomePage />)
    const description = document.getElementById('scene-description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveTextContent(/noyau lumineux/i)
  })

  it('ne produit aucune erreur de console au montage', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<HomePage />)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})

describe('HomePage — repli sans WebGL', () => {
  it('affiche l’aperçu statique et le bandeau d’information', () => {
    render(<HomePage />)

    expect(screen.getByTestId('webgl-fallback')).toBeInTheDocument()
    expect(screen.getByTestId('webgl-notice')).toBeInTheDocument()
    expect(screen.queryByTestId('experience-canvas')).not.toBeInTheDocument()
  })

  it('conserve la navigation, les caractéristiques et les appels à l’action', () => {
    render(<HomePage />)

    expect(screen.getByRole('navigation', { name: /navigation principale/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /explorer l’expérience|explorer l'expérience/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /recommencer l’expérience|recommencer l'expérience/i })
    ).toBeInTheDocument()
    expect(screen.getByTestId('feature-adaptive-power')).toBeInTheDocument()
  })

  it('libère immédiatement l’écran de chargement', async () => {
    render(<HomePage />)
    await waitFor(() => {
      expect(useExperienceStore.getState().sceneReady).toBe(true)
    })
  })
})

describe('HomePage — mouvement réduit', () => {
  it('n’active pas la parallaxe au pointeur', async () => {
    setMatchingMediaQueries(['prefers-reduced-motion'])
    render(<HomePage />)

    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 900, clientY: 400, pointerType: 'mouse' })
    )

    expect(scrollState.pointerX).toBe(0)
    expect(scrollState.pointerY).toBe(0)
  })

  it('garde tout le contenu accessible', () => {
    setMatchingMediaQueries(['prefers-reduced-motion'])
    render(<HomePage />)

    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(4)
    expect(screen.getByTestId('hotspot-card')).toBeInTheDocument()
  })
})

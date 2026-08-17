import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveSection } from '../components/sections/InteractiveSection'
import { scrollState } from '../store/scrollState'
import { useExperienceStore } from '../store/useExperienceStore'
import { HOTSPOTS } from '../utils/content'

describe('InteractiveSection', () => {
  it('propose tous les points d’intérêt sous forme de boutons', () => {
    render(<InteractiveSection />)
    for (const hotspot of HOTSPOTS) {
      expect(screen.getByRole('button', { name: hotspot.label })).toBeInTheDocument()
    }
  })

  it('affiche la fiche descriptive du point sélectionné', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    expect(screen.getByText(/aucun point sélectionné/i)).toBeInTheDocument()

    await user.click(screen.getByTestId('hotspot-rings'))

    const card = screen.getByTestId('hotspot-card')
    expect(card).toHaveTextContent('Anneaux gyroscopiques')
    expect(card).toHaveTextContent('3 axes indépendants')
    expect(screen.getByTestId('hotspot-rings')).toHaveAttribute('aria-pressed', 'true')
  })

  it('déselectionne un point déjà actif', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    await user.click(screen.getByTestId('hotspot-core'))
    await user.click(screen.getByTestId('hotspot-core'))

    expect(useExperienceStore.getState().selectedHotspotId).toBeNull()
    expect(screen.getByText(/aucun point sélectionné/i)).toBeInTheDocument()
  })

  it('met les animations en pause et les reprend', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    const toggle = screen.getByTestId('toggle-animations')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    expect(useExperienceStore.getState().animationsPaused).toBe(true)
    expect(screen.getByRole('button', { name: /reprendre les animations/i })).toBeInTheDocument()
  })

  it('applique le zoom dans des limites raisonnables', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    const zoomIn = screen.getByTestId('zoom-in')
    for (let index = 0; index < 20; index += 1) {
      await user.click(zoomIn)
    }
    expect(scrollState.zoom).toBeLessThanOrEqual(3.6)
    expect(scrollState.zoom).toBeGreaterThan(0)
  })

  it('pilote la caméra au clavier et la réinitialise', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    const stage = screen.getByTestId('stage-control')
    stage.focus()
    expect(stage).toHaveFocus()

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}')
    expect(scrollState.orbitYaw).toBeGreaterThan(0)
    expect(scrollState.orbitPitch).toBeGreaterThan(0)

    await user.click(screen.getByTestId('reset-camera'))
    expect(scrollState.orbitYaw).toBe(0)
    expect(scrollState.orbitPitch).toBe(0)
    expect(scrollState.zoom).toBe(0)
  })

  it('borne le basculement vertical au clavier', async () => {
    const user = userEvent.setup()
    render(<InteractiveSection />)

    screen.getByTestId('stage-control').focus()
    await user.keyboard('{ArrowUp>30/}')
    expect(scrollState.orbitPitch).toBeLessThanOrEqual(0.55)
  })

  it('laisse le geste vertical au défilement de la page', () => {
    render(<InteractiveSection />)
    // `touch-action: pan-y` est la garantie que la scène ne capte jamais le
    // défilement tactile ; la classe qui le porte doit rester en place.
    expect(screen.getByTestId('stage-control')).toHaveClass('stage-control')
  })
})

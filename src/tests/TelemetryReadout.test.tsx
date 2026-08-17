import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TelemetryReadout } from '../components/ui/TelemetryReadout'
import { SectionEyebrow } from '../components/ui/SectionEyebrow'
import { scrollState } from '../store/scrollState'
import { useExperienceStore } from '../store/useExperienceStore'
import { CAMERA_POSES } from '../utils/cameraPath'
import { SECTIONS } from '../utils/content'

describe('TelemetryReadout', () => {
  it('est masqué aux lecteurs d’écran', () => {
    render(<TelemetryReadout />)
    // Les valeurs changent plusieurs fois par seconde : les annoncer serait
    // hostile. Toutes les informations utiles existent en clair ailleurs.
    expect(screen.getByTestId('telemetry-readout')).toHaveAttribute('aria-hidden', 'true')
  })

  it('affiche l’index de pose de la section courante', async () => {
    useExperienceStore.setState({ activeSection: 'performance' })
    render(<TelemetryReadout />)

    await waitFor(() => {
      expect(screen.getByTestId('telemetry-readout')).toHaveTextContent('04/05')
    })
  })

  it('signale une qualité rétrogradée sans changer le texte affiché', () => {
    useExperienceStore.setState({ resolvedQuality: 'low' })
    render(<TelemetryReadout />)

    const readout = screen.getByTestId('telemetry-readout')
    expect(readout).toHaveTextContent('faible')
    // L'état hors nominal passe par un attribut de données, pas par une couleur
    // seule : l'information reste disponible aux tests comme aux styles.
    expect(readout.querySelector('[data-state="warn"]')).not.toBeNull()
  })

  it('indique le repli quand WebGL est indisponible', () => {
    useExperienceStore.setState({ webglAvailable: false })
    render(<TelemetryReadout />)
    expect(screen.getByTestId('telemetry-readout')).toHaveTextContent('repli')
  })

  it('n’affiche pas de distance tant qu’aucune image n’a été rendue', () => {
    render(<TelemetryReadout />)
    expect(screen.getByTestId('telemetry-readout')).toHaveTextContent('——')
    expect(scrollState.cameraDistance).toBe(0)
  })
})

describe('SectionEyebrow', () => {
  it('affiche l’index et les coordonnées réelles de la pose caméra', () => {
    render(<SectionEyebrow section="technology">Technologie</SectionEyebrow>)

    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('Technologie')).toBeInTheDocument()
    // Les coordonnées doivent correspondre à la table qui pilote la caméra.
    const pose = CAMERA_POSES.find((entry) => entry.section === 'technology')
    expect(pose).toBeDefined()
    expect(screen.getByText(/pose x3\.6 y1\.9 z5\.9/)).toBeInTheDocument()
  })

  it('numérote autant de poses que la page a de sections', () => {
    // La numérotation n'est légitime que si la séquence est réelle : une pose
    // de caméra par section, dans le même ordre.
    expect(CAMERA_POSES).toHaveLength(SECTIONS.length)
    CAMERA_POSES.forEach((pose, index) => {
      expect(pose.section).toBe(SECTIONS[index]?.id)
    })
  })
})

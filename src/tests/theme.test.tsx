import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useExperienceStore } from '../store/useExperienceStore'
import { setMatchingMediaQueries } from './setup'
import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  applyTheme,
  loadStoredTheme,
  resolveTheme,
  storeTheme,
  systemTheme,
} from '../utils/theme'
import { glowBlending, scenePalette } from '../utils/scenePalette'

describe('résolution du thème', () => {
  it('suit le système en mode automatique', () => {
    expect(systemTheme()).toBe('dark')
    expect(resolveTheme('auto')).toBe('dark')

    setMatchingMediaQueries(['prefers-color-scheme: light'])
    expect(systemTheme()).toBe('light')
    expect(resolveTheme('auto')).toBe('light')
  })

  it('ignore le système quand un choix explicite est fait', () => {
    setMatchingMediaQueries(['prefers-color-scheme: light'])
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
  })

  it('mémorise et relit la préférence', () => {
    storeTheme('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(loadStoredTheme()).toBe('light')
  })

  it('ignore une valeur corrompue', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sépia')
    expect(loadStoredTheme()).toBeNull()
  })
})

describe('application du thème au document', () => {
  it('pose data-theme, color-scheme et la couleur de barre d’adresse', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)

    try {
      applyTheme('light')
      expect(document.documentElement.dataset.theme).toBe('light')
      expect(document.documentElement.style.colorScheme).toBe('light')
      expect(meta.getAttribute('content')).toBe(THEME_COLORS.light)

      applyTheme('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark)
    } finally {
      meta.remove()
    }
  })
})

describe('ThemeToggle', () => {
  it('expose trois choix nommés dans un groupe', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('group', { name: /thème de la page/i })).toBeInTheDocument()

    for (const name of [/suivre le système/i, /thème clair/i, /thème sombre/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('démarre sur « système »', () => {
    render(<ThemeToggle />)
    expect(screen.getByTestId('theme-option-auto')).toHaveAttribute('aria-pressed', 'true')
  })

  it('applique le choix et le mémorise', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByTestId('theme-option-light'))

    expect(useExperienceStore.getState().themePreference).toBe('light')
    expect(useExperienceStore.getState().resolvedTheme).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByTestId('theme-option-light')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-option-auto')).toHaveAttribute('aria-pressed', 'false')
  })

  it('permet de revenir au réglage du système après un choix manuel', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByTestId('theme-option-light'))
    await user.click(screen.getByTestId('theme-option-auto'))

    expect(useExperienceStore.getState().themePreference).toBe('auto')
    expect(useExperienceStore.getState().resolvedTheme).toBe('dark')
  })

  it('annonce le changement aux technologies d’assistance', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByTestId('theme-option-dark'))
    expect(useExperienceStore.getState().announcement).toMatch(/sombre/i)
  })

  it('est navigable au clavier', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.tab()
    expect(screen.getByTestId('theme-option-auto')).toHaveFocus()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(useExperienceStore.getState().themePreference).toBe('light')
  })
})

describe('palette de la scène 3D', () => {
  it('bascule en fusion normale sur fond clair', () => {
    // C'est le point qui rend le mode clair non trivial : la fusion additive
    // n'ajoute rien de visible à du quasi-blanc.
    expect(scenePalette('dark').additive).toBe(true)
    expect(scenePalette('light').additive).toBe(false)
    // THREE.AdditiveBlending vaut 2, NormalBlending vaut 1.
    expect(glowBlending(scenePalette('dark'))).not.toBe(glowBlending(scenePalette('light')))
  })

  it('assombrit l’objet et éclaircit le fond en thème clair', () => {
    const dark = scenePalette('dark')
    const light = scenePalette('light')

    expect(light.fog).not.toBe(dark.fog)
    // L'ambiante monte pour compenser la perte des liserés lumineux.
    expect(light.ambientIntensity).toBeGreaterThan(dark.ambientIntensity)
    expect(light.cyanRimRange[1]).toBeLessThan(dark.cyanRimRange[1])
    // Le socle devient opaque : les ombres portées y sont bien plus lisibles.
    expect(light.basePlateOpacity).toBeGreaterThan(dark.basePlateOpacity)
  })

  it('couvre exactement les mêmes réglages dans les deux thèmes', () => {
    // Un oubli dans une palette produirait un `undefined` silencieux au rendu.
    expect(Object.keys(scenePalette('light')).sort()).toEqual(
      Object.keys(scenePalette('dark')).sort()
    )
    for (const value of Object.values(scenePalette('light'))) {
      expect(value).toBeDefined()
    }
  })
})

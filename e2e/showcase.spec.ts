import { expect, test } from '@playwright/test'
import { collectConsoleErrors, openNavigation, waitForExperienceReady } from './helpers'

test.describe('Parcours principal', () => {
  test('ouvre la page et affiche le contenu essentiel', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    await page.goto('/')

    await expect(page).toHaveTitle(/NOVA CORE/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation', { name: /navigation principale/i })).toBeVisible()

    await waitForExperienceReady(page)
    expect(errors, `Erreurs de console : ${errors.join(' | ')}`).toEqual([])
  })

  test('retire l’écran de chargement et libère le contenu', async ({ page }) => {
    await page.goto('/')

    const loading = page.getByTestId('loading-screen')
    await loading.waitFor({ state: 'hidden', timeout: 20_000 })
    await expect(loading).toHaveCount(0)

    // Le contenu doit être réellement atteignable une fois l'écran retiré.
    await expect(page.getByRole('link', { name: /explorer l['’]expérience/i })).toBeVisible()
  })

  test('navigue vers chaque section par le menu', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    for (const id of ['technology', 'interactive', 'performance', 'final']) {
      await openNavigation(page)
      await page.getByTestId(`nav-link-${id}`).click()
      await expect(page.locator(`#${id}`)).toBeInViewport({ timeout: 10_000 })
    }
  })

  test('sélectionne un point d’intérêt et affiche sa fiche', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#interactive').scrollIntoViewIfNeeded()

    const hotspot = page.getByTestId('hotspot-shell')
    await hotspot.click()

    await expect(hotspot).toHaveAttribute('aria-pressed', 'true')
    const card = page.getByTestId('hotspot-card')
    await expect(card).toContainText('Coque métallique segmentée')
    await expect(card).toContainText('6 segments')
  })

  test('pilote la caméra puis la réinitialise', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#interactive').scrollIntoViewIfNeeded()

    await page.getByTestId('zoom-in').click()
    await page.getByTestId('zoom-out').click()
    await page.getByTestId('reset-camera').click()

    const toggle = page.getByTestId('toggle-animations')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toContainText(/reprendre/i)
  })

  test('mémorise le niveau de qualité choisi après rechargement', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#performance').scrollIntoViewIfNeeded()
    await page.getByTestId('quality-option-low').click()
    await expect(page.getByTestId('quality-option-low')).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await waitForExperienceReady(page)
    await page.locator('#performance').scrollIntoViewIfNeeded()

    await expect(page.getByTestId('quality-option-low')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('quality-option-auto')).toHaveAttribute('aria-pressed', 'false')
  })

  test('ne provoque aucun débordement horizontal', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    for (const id of ['hero', 'technology', 'interactive', 'performance', 'final']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      // Une tolérance d'un pixel absorbe les arrondis de sous-pixel.
      expect(
        overflow.scrollWidth,
        `Débordement horizontal détecté dans la section « ${id} »`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1)
    }
  })

  test('reste fonctionnel après un retour en arrière dans le défilement', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#final').scrollIntoViewIfNeeded()
    await expect(page.locator('#final')).toBeInViewport()

    await page.getByTestId('restart').click()
    await expect(page.locator('#hero')).toBeInViewport({ timeout: 10_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Accessibilité', () => {
  test('le lien d’évitement mène au contenu principal', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: /aller au contenu principal/i })
    await expect(skip).toBeFocused()
    await expect(skip).toHaveAttribute('href', '#main-content')
  })

  test('la scène 3D porte une description textuelle', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    const description = page.locator('#scene-description')
    await expect(description).toHaveCount(1)
    await expect(description).toContainText(/noyau lumineux/i)
  })

  test('la surface de contrôle est atteignable et pilotable au clavier', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#interactive').scrollIntoViewIfNeeded()
    const stage = page.getByTestId('stage-control')
    await stage.focus()
    await expect(stage).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowUp')
    // La page ne doit pas avoir défilé : les flèches pilotent la scène.
    await expect(stage).toBeFocused()
  })
})

test.describe('Thème', () => {
  test('suit la préférence système au premier chargement', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await waitForExperienceReady(page)

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.getByTestId('theme-option-auto')).toHaveAttribute('aria-pressed', 'true')
  })

  test('bascule en clair puis en sombre depuis l’en-tête', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await waitForExperienceReady(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByTestId('theme-option-light').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    // La couleur de barre d'adresse suit le thème.
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#eef2f9')

    await page.getByTestId('theme-option-dark').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#04060e')
  })

  test('mémorise le choix et l’applique sans clignotement au rechargement', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await waitForExperienceReady(page)
    await page.getByTestId('theme-option-light').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.reload()
    // Vérifié avant même que l'application ne soit prête : c'est le script
    // d'amorçage en tête de document qui doit avoir posé le thème.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await waitForExperienceReady(page)
    await expect(page.getByTestId('theme-option-light')).toHaveAttribute('aria-pressed', 'true')
  })

  test('le choix manuel prime sur un changement du système', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.getByTestId('theme-option-light').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(500)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('le contenu reste lisible et sans débordement en thème clair', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await waitForExperienceReady(page)

    for (const id of ['hero', 'technology', 'interactive', 'performance', 'final']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(
        overflow,
        `Débordement horizontal en thème clair, section « ${id} »`
      ).toBeLessThanOrEqual(1)
    }

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('hotspot-card')).toBeVisible()
  })
})

test.describe('Mise en page mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('affiche le menu compact et garde le contenu lisible', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    const toggle = page.getByTestId('nav-toggle')
    await expect(toggle).toBeVisible()
    await expect(page.getByTestId('nav-list')).toBeHidden()

    await toggle.click()
    await expect(page.getByTestId('nav-list')).toBeVisible()

    await page.getByTestId('nav-link-performance').click()
    await expect(page.locator('#performance')).toBeInViewport({ timeout: 10_000 })

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('conserve des cibles tactiles suffisamment grandes', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)
    await page.locator('#interactive').scrollIntoViewIfNeeded()

    const button = page.getByTestId('hotspot-core')
    const box = await button.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36)
  })
})

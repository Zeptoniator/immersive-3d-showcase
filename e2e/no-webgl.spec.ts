import { expect, test } from '@playwright/test'
import { collectConsoleErrors, waitForExperienceReady } from './helpers'

/**
 * Simulation d'un navigateur sans WebGL.
 *
 * `getContext` est neutralisé avant tout script de la page : la détection
 * conclut donc à l'absence de WebGL exactement comme sur une machine dont
 * l'accélération matérielle est désactivée.
 */
test.describe('Repli sans WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        contextId: string,
        ...rest: unknown[]
      ) {
        if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
          return null
        }
        return (original as (...args: unknown[]) => unknown).call(this, contextId, ...rest)
      } as typeof HTMLCanvasElement.prototype.getContext
    })
  })

  test('affiche l’aperçu statique à la place de la scène', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await expect(page.getByTestId('webgl-fallback')).toBeVisible()
    await expect(page.getByTestId('webgl-notice')).toBeVisible()
    await expect(page.getByTestId('experience-canvas')).toHaveCount(0)
  })

  test('conserve titre, présentation, caractéristiques et appels à l’action', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation', { name: /navigation principale/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /explorer l['’]expérience/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /découvrir la technologie/i })).toBeVisible()

    for (const id of ['adaptive-power', 'light-architecture', 'smart-control']) {
      await expect(page.getByTestId(`feature-${id}`)).toBeVisible()
    }

    await expect(page.getByTestId('restart')).toBeVisible()
  })

  test('laisse les points d’intérêt utilisables', async ({ page }) => {
    await page.goto('/')
    await waitForExperienceReady(page)

    await page.locator('#interactive').scrollIntoViewIfNeeded()
    await page.getByTestId('hotspot-emitters').click()
    await expect(page.getByTestId('hotspot-card')).toContainText('Émetteurs lumineux')
  })

  test('ne laisse jamais un écran vide ni d’erreur non gérée', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    await page.goto('/')
    await waitForExperienceReady(page)

    const visibleText = await page.locator('main').innerText()
    expect(visibleText.length).toBeGreaterThan(400)
    expect(errors, `Erreurs de console : ${errors.join(' | ')}`).toEqual([])
  })
})

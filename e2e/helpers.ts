import type { Page } from '@playwright/test'

/**
 * Ouvre le menu de navigation s'il est en mode compact.
 *
 * Le même test peut ainsi s'exécuter sur les projets ordinateur et mobile sans
 * dupliquer de scénario.
 */
export async function openNavigation(page: Page): Promise<void> {
  const toggle = page.getByTestId('nav-toggle')
  if (!(await toggle.isVisible())) return
  if ((await toggle.getAttribute('aria-expanded')) === 'true') return
  await toggle.click()
}

/**
 * Attend la disparition complète de l'écran de chargement.
 *
 * L'application se libère d'elle-même au bout de six secondes grâce à son filet
 * de sécurité ; la marge généreuse ne couvre que la lenteur du rendu logiciel
 * en environnement headless, jamais une attente d'animation.
 */
export async function waitForExperienceReady(page: Page): Promise<void> {
  await page.getByTestId('loading-screen').waitFor({ state: 'hidden', timeout: 40_000 })
}

/**
 * Collecte les erreurs de console et les exceptions non interceptées.
 *
 * Les messages liés à l'absence d'accélération matérielle sont ignorés : en
 * environnement headless, le rendu logiciel émet des avertissements attendus.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  const ignored = /swiftshader|gpu|webgl|deprecated|Automatic fallback/i

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (ignored.test(text)) return
    errors.push(text)
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

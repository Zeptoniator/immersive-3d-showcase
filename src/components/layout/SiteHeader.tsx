import { useEffect, useId, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useExperienceStore } from '../../store/useExperienceStore'
import { PRODUCT_NAME, SECTIONS } from '../../utils/content'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ThemeToggle } from '../ui/ThemeToggle'

/**
 * En-tête fixe : marque et navigation par ancres.
 *
 * Sur petit écran la liste devient un tiroir piloté par un bouton
 * `aria-expanded` / `aria-controls`. Au-delà du point de rupture, le tiroir est
 * toujours ouvert : l'attribut `hidden` n'est appliqué qu'en mode compact.
 */
export function SiteHeader() {
  const menuId = useId()
  const activeSection = useExperienceStore((state) => state.activeSection)
  const isCompact = useMediaQuery('(max-width: 47.99em)')
  const [menuOpen, setMenuOpen] = useState(false)

  // La fermeture à la touche Échap est attendue de tout menu déroulant.
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const listHidden = isCompact && !menuOpen

  return (
    <header className="site-header">
      <a className="brand" href="#hero">
        <span className="brand__mark" aria-hidden="true" />
        {PRODUCT_NAME}
      </a>

      <div className="site-header__tools">
        <ThemeToggle />

        <nav className="site-nav" aria-label="Navigation principale">
          <button
            type="button"
            className="btn btn--ghost btn--icon site-nav__toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            data-testid="nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span className="visually-hidden">
              {menuOpen ? 'Fermer le menu' : 'Ouvrir le menu de navigation'}
            </span>
          </button>

          <ul className="site-nav__list" id={menuId} hidden={listHidden} data-testid="nav-list">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  className="site-nav__link"
                  href={`#${section.id}`}
                  aria-current={activeSection === section.id}
                  data-testid={`nav-link-${section.id}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

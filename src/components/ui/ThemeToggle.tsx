import { Monitor, Moon, Sun } from 'lucide-react'
import { useExperienceStore } from '../../store/useExperienceStore'
import { THEME_LABELS, type ThemePreference } from '../../utils/theme'

const OPTIONS: ReadonlyArray<{ value: ThemePreference; Icon: typeof Sun }> = [
  { value: 'auto', Icon: Monitor },
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
]

interface ThemeToggleProps {
  /** Identifiant du libellé, pour permettre plusieurs instances. */
  id?: string
}

/**
 * Sélecteur de thème : système, clair ou sombre.
 *
 * Trois boutons `aria-pressed` dans un `role="group"`, comme le sélecteur de
 * qualité — même mécanique, donc rien de nouveau à apprendre. Chaque bouton
 * porte un nom accessible explicite ; l'icône seule ne suffirait pas, et une
 * bascule à deux états ne permettrait pas de revenir au réglage du système
 * après un choix manuel.
 */
export function ThemeToggle({ id = 'theme-toggle' }: ThemeToggleProps) {
  const themePreference = useExperienceStore((state) => state.themePreference)
  const resolvedTheme = useExperienceStore((state) => state.resolvedTheme)
  const setThemePreference = useExperienceStore((state) => state.setThemePreference)
  const announce = useExperienceStore((state) => state.announce)

  const handleSelect = (preference: ThemePreference) => {
    setThemePreference(preference)
    announce(
      preference === 'auto'
        ? 'Thème réglé sur la préférence du système.'
        : `Thème ${THEME_LABELS[preference].toLowerCase()} activé.`
    )
  }

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-labelledby={`${id}-label`}
      data-testid="theme-toggle"
      data-resolved={resolvedTheme}
    >
      <span className="visually-hidden" id={`${id}-label`}>
        Thème de la page
      </span>

      {OPTIONS.map(({ value, Icon }) => (
        <button
          key={value}
          type="button"
          className="theme-toggle__option"
          aria-pressed={themePreference === value}
          data-testid={`theme-option-${value}`}
          onClick={() => handleSelect(value)}
        >
          <Icon size={15} aria-hidden="true" />
          <span className="visually-hidden">
            {value === 'auto' ? 'Suivre le système' : `Thème ${THEME_LABELS[value].toLowerCase()}`}
          </span>
        </button>
      ))}
    </div>
  )
}

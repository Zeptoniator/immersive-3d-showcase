import { useExperienceStore } from '../../store/useExperienceStore'
import { QUALITY_LABELS } from '../../utils/quality'
import type { QualityPreference } from '../../types'

const OPTIONS: ReadonlyArray<QualityPreference> = ['auto', 'high', 'medium', 'low']

interface QualitySelectorProps {
  /** Affiche le niveau réellement appliqué à côté du sélecteur. */
  showResolved?: boolean
  /** Identifiant du libellé, pour rattacher le groupe à un titre existant. */
  id?: string
}

/**
 * Sélecteur manuel de qualité graphique.
 *
 * Le choix prime sur la détection automatique et est mémorisé dans
 * `localStorage`. Il est construit avec de vrais boutons `aria-pressed` dans un
 * `role="group"` : la navigation au clavier fonctionne sans code supplémentaire
 * et chaque bouton porte un nom accessible explicite.
 */
export function QualitySelector({
  showResolved = true,
  id = 'quality-selector',
}: QualitySelectorProps) {
  const qualityPreference = useExperienceStore((state) => state.qualityPreference)
  const resolvedQuality = useExperienceStore((state) => state.resolvedQuality)
  const setQualityPreference = useExperienceStore((state) => state.setQualityPreference)
  const announce = useExperienceStore((state) => state.announce)

  const handleSelect = (preference: QualityPreference) => {
    setQualityPreference(preference)
    announce(
      preference === 'auto'
        ? 'Qualité graphique repassée en mode automatique.'
        : `Qualité graphique réglée sur ${QUALITY_LABELS[preference].toLowerCase()}.`
    )
  }

  return (
    <div className="quality-selector" data-testid="quality-selector">
      <span className="quality-selector__label" id={`${id}-label`}>
        Qualité
      </span>

      <div className="quality-selector__options" role="group" aria-labelledby={`${id}-label`}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className="quality-selector__option"
            aria-pressed={qualityPreference === option}
            data-testid={`quality-option-${option}`}
            onClick={() => handleSelect(option)}
          >
            {QUALITY_LABELS[option]}
          </button>
        ))}
      </div>

      {showResolved && qualityPreference === 'auto' ? (
        <span className="quality-selector__resolved" data-testid="quality-resolved">
          appliquée : {QUALITY_LABELS[resolvedQuality].toLowerCase()}
        </span>
      ) : null}
    </div>
  )
}

import { useCallback } from 'react'
import { RefreshCw, Rocket } from 'lucide-react'
import { resetScrollState } from '../../store/scrollState'
import { useExperienceStore } from '../../store/useExperienceStore'
import { PRODUCT_NAME, TECH_SPECS } from '../../utils/content'
import { SectionEyebrow } from '../ui/SectionEyebrow'

/**
 * Section finale : appel à l'action, remise à zéro et fiche technique.
 */
export function FinalSection() {
  const resetExperience = useExperienceStore((state) => state.resetExperience)
  const announce = useExperienceStore((state) => state.announce)

  const restart = useCallback(() => {
    resetExperience()
    resetScrollState()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    announce("L'expérience a été réinitialisée. Retour au début de la page.")
  }, [announce, resetExperience])

  return (
    <section id="final" className="section" aria-labelledby="final-title">
      <div className="section__inner final__inner">
        <div>
          <SectionEyebrow section="final">Et ensuite</SectionEyebrow>
          <h2 className="section-title" id="final-title" data-reveal>
            Une base réutilisable pour vos propres projets
          </h2>
          <p className="section-lead" data-reveal>
            Cette page est un point de départ complet : scène, chorégraphie au défilement, gestion
            de la qualité, repli sans WebGL, tests unitaires et de bout en bout. Remplacez{' '}
            {PRODUCT_NAME} par votre propre modèle et le reste tient.
          </p>

          <div className="btn__group" style={{ marginTop: 'var(--space-lg)' }} data-reveal>
            <button
              type="button"
              className="btn btn--primary"
              onClick={restart}
              data-testid="restart"
            >
              <RefreshCw size={18} aria-hidden="true" />
              Recommencer l&apos;expérience
            </button>
            <a className="btn btn--secondary" href="#technology">
              <Rocket size={18} aria-hidden="true" />
              Revoir la technologie
            </a>
          </div>
        </div>

        <div className="panel" data-reveal>
          <h3 className="panel__title" id="specs-title">
            Informations techniques
          </h3>
          <dl className="spec-list" aria-labelledby="specs-title">
            {TECH_SPECS.map((spec) => (
              <div className="spec-list__row" key={spec.label}>
                <dt className="spec-list__term">{spec.label}</dt>
                <dd className="spec-list__value">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

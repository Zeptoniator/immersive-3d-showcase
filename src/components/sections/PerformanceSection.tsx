import { PERFORMANCE_STATS, PRODUCT_NAME } from '../../utils/content'
import { QualitySelector } from '../ui/QualitySelector'

/**
 * Section Performances.
 *
 * Les indicateurs décrivent le comportement de la démonstration, pas des
 * caractéristiques produit : la mention l'indique explicitement sous le tableau.
 * C'est aussi ici que l'utilisateur peut forcer un niveau de qualité.
 */
export function PerformanceSection() {
  return (
    <section id="performance" className="section" aria-labelledby="performance-title">
      <div className="section__inner">
        <p className="section-eyebrow" data-reveal>
          Performances
        </p>
        <h2 className="section-title" id="performance-title" data-reveal>
          Le rendu s&apos;adapte à votre machine
        </h2>
        <p className="section-lead" data-reveal>
          Le niveau de qualité est déduit de la taille d&apos;écran, du ratio de pixels, du nombre
          de cœurs disponibles et de la fluidité réellement mesurée. Vous pouvez le forcer à tout
          moment : votre choix est mémorisé sur cet appareil.
        </p>

        <div className="stat-grid">
          {PERFORMANCE_STATS.map((stat) => (
            <article className="panel" key={stat.id} data-reveal data-testid={`stat-${stat.id}`}>
              <p className="stat__label">{stat.label}</p>
              <p className="stat__value">{stat.value}</p>
              <p className="panel__text" style={{ marginTop: 'var(--space-2xs)' }}>
                {stat.detail}
              </p>
            </article>
          ))}
        </div>

        <p className="disclaimer">
          Indicateurs fournis à titre de démonstration technique. {PRODUCT_NAME} est un produit
          fictif : ces valeurs décrivent le comportement de cette page web et ne constituent pas des
          caractéristiques commerciales.
        </p>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <QualitySelector />
        </div>
      </div>
    </section>
  )
}

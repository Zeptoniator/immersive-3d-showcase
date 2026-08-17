import { Link } from 'react-router-dom'
import { PRODUCT_NAME } from '../utils/content'

/** Page 404 sobre, cohérente avec l'identité visuelle du site. */
export function NotFoundPage() {
  return (
    <main id="main-content" className="section section--full">
      <div className="section__inner">
        <p className="eyebrow">
          <span className="eyebrow__label">Erreur 404</span>
        </p>
        <h1 className="section-title">Cette page n&apos;existe pas</h1>
        <p className="section-lead">
          L&apos;adresse demandée ne correspond à aucune section de la démonstration {PRODUCT_NAME}.
        </p>
        <p style={{ marginTop: 'var(--space-lg)' }}>
          <Link className="btn btn--primary" to="/">
            Revenir à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  )
}

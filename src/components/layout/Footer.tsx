import { PRODUCT_NAME } from '../../utils/content'

/** Pied de page sobre : mentions du projet et rappel du cadre de démonstration. */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="brand" style={{ marginBottom: 'var(--space-2xs)' }}>
            <span className="brand__mark" aria-hidden="true" />
            {PRODUCT_NAME}
          </p>
          <p className="site-footer__note">
            Démonstration Three.js et React Three Fiber. {PRODUCT_NAME} est un produit fictif créé
            pour illustrer une architecture de site vitrine 3D ; les valeurs affichées n&apos;ont
            aucune portée commerciale.
          </p>
        </div>

        <ul className="site-footer__links">
          <li>
            <a href="#hero">Retour en haut</a>
          </li>
          <li>
            <a href="#technology">Technologie</a>
          </li>
          <li>
            <a href="#interactive">Exploration</a>
          </li>
          <li>
            <a href="https://threejs.org/" target="_blank" rel="noreferrer noopener">
              Three.js
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

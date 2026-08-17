import { MonitorX } from 'lucide-react'
import { PRODUCT_NAME } from '../../utils/content'

interface WebGLFallbackProps {
  /** Motif technique remonté par la détection ou par la frontière d'erreur. */
  reason?: string
}

/**
 * Repli affiché lorsque WebGL est indisponible ou que la scène a échoué.
 *
 * Il ne remplace que la couche 3D : le titre, la présentation, les
 * caractéristiques, les appels à l'action et la navigation restent rendus par
 * les sections HTML habituelles. L'utilisateur n'obtient donc jamais un écran
 * vide, et le contenu du site reste intégralement consultable.
 */
export function WebGLFallback({ reason }: WebGLFallbackProps) {
  return (
    <div className="webgl-fallback" data-testid="webgl-fallback">
      <div className="webgl-fallback__figure" aria-hidden="true">
        <span className="webgl-fallback__ring" />
        <span className="webgl-fallback__ring" />
        <span className="webgl-fallback__ring" />
      </div>

      <div className="webgl-fallback__content">
        <p className="section-eyebrow">Mode dégradé</p>
        <h3 className="panel__title">Aperçu statique de {PRODUCT_NAME}</h3>
        <p className="panel__text">
          Le rendu 3D temps réel n&apos;a pas pu démarrer sur cet appareil. L&apos;intégralité du
          contenu — présentation, caractéristiques techniques, points d&apos;intérêt et navigation —
          reste accessible ci-dessous.
        </p>
        <p className="panel__text" style={{ marginTop: 'var(--space-2xs)' }}>
          Causes fréquentes : accélération matérielle désactivée dans le navigateur, pilote
          graphique manquant, ou WebGL bloqué par une extension. La marche à suivre sous Ubuntu est
          détaillée dans le fichier <code>README.md</code>.
        </p>
        {reason ? (
          <p className="loading-screen__status" style={{ marginTop: 'var(--space-sm)' }}>
            Détail technique : {reason}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Bandeau discret signalant le mode dégradé en haut du contenu. */
export function WebGLNotice() {
  return (
    <p className="notice" role="status" data-testid="webgl-notice">
      <MonitorX className="notice__icon" size={18} aria-hidden="true" />
      <span>
        WebGL n&apos;est pas disponible : la scène 3D est remplacée par un aperçu statique. Tout le
        contenu du site reste consultable.
      </span>
    </p>
  )
}

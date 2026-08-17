import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Interface de repli ; reçoit l'erreur interceptée. */
  fallback: (error: Error) => ReactNode
  /** Notification pour la couche appelante (journalisation, bascule de mode). */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Frontière d'erreur React.
 *
 * Elle isole la couche 3D : une exception lors de l'initialisation du renderer,
 * de la compilation d'un shader ou du chargement d'une ressource ne doit jamais
 * laisser l'utilisateur devant un écran noir. Le contenu HTML de la page reste
 * de toute façon rendu en dehors de cette frontière.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // L'erreur est remontée telle quelle : elle n'est ni avalée ni masquée.
    console.error('[NOVA CORE] Erreur interceptée dans la couche 3D :', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (error) return this.props.fallback(error)
    return this.props.children
  }
}

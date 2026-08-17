/**
 * État de défilement mutable, tenu hors de React.
 *
 * ScrollTrigger écrit dans cet objet à chaque image et `useFrame` le lit : aucun
 * rendu React n'est déclenché par le défilement, ce qui évite de reconstruire
 * l'arbre de composants soixante fois par seconde.
 */
export interface ScrollState {
  /** Progression globale de la page, de 0 (haut) à 1 (bas). */
  progress: number
  /** Progression interne de la section Technologie, de 0 à 1. */
  technology: number
  /** Progression interne de la section Exploration, de 0 à 1. */
  interactive: number
  /** Progression interne de la section Performances, de 0 à 1. */
  performance: number
  /** Progression interne de la section finale, de 0 à 1. */
  final: number
  /** Position du pointeur normalisée dans `[-1, 1]`, pour la parallaxe. */
  pointerX: number
  pointerY: number
  /** Angle d'orbite ajouté par l'utilisateur dans la section Exploration. */
  orbitYaw: number
  orbitPitch: number
  /** Distance de caméra choisie par l'utilisateur (zoom manuel). */
  zoom: number
  /**
   * Distance réelle entre la caméra et l'objet, en unités de scène.
   *
   * Écrite par `CameraRig` à chaque image et lue par le bandeau de relevé :
   * la valeur affichée à l'écran est donc la vraie, pas une simulation.
   * Vaut 0 tant qu'aucune image n'a été rendue (repli sans WebGL).
   */
  cameraDistance: number
}

export const scrollState: ScrollState = {
  progress: 0,
  technology: 0,
  interactive: 0,
  performance: 0,
  final: 0,
  pointerX: 0,
  pointerY: 0,
  orbitYaw: 0,
  orbitPitch: 0,
  zoom: 0,
  cameraDistance: 0,
}

/** Réinitialise l'état de défilement (bouton « Recommencer », démontage). */
export function resetScrollState(): void {
  scrollState.progress = 0
  scrollState.technology = 0
  scrollState.interactive = 0
  scrollState.performance = 0
  scrollState.final = 0
  scrollState.pointerX = 0
  scrollState.pointerY = 0
  scrollState.orbitYaw = 0
  scrollState.orbitPitch = 0
  scrollState.zoom = 0
  scrollState.cameraDistance = 0
}

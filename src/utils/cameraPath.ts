import type { SectionId } from '../types'

/** Une pose de la trajectoire cinématique. */
export interface CameraPose {
  /** Section à laquelle cette pose correspond. */
  section: SectionId
  /** Progression globale de la page à laquelle la pose est atteinte. */
  at: number
  position: [number, number, number]
  lookAt: [number, number, number]
}

/**
 * Trajectoire de la caméra, du hero jusqu'à la section finale.
 *
 * Cette table est la source unique de vérité, partagée par deux consommateurs :
 * `CameraRig`, qui interpole entre ces poses à chaque image, et les intitulés de
 * section, qui affichent les coordonnées de la pose correspondante.
 *
 * L'index affiché à côté du titre d'une section n'est donc pas une numérotation
 * décorative : la page compte exactement autant de sections que la caméra a de
 * poses, et le numéro désigne réellement l'endroit où se trouve la caméra
 * pendant qu'on lit ce texte.
 */
export const CAMERA_POSES: ReadonlyArray<CameraPose> = [
  { section: 'hero', at: 0.0, position: [0.4, 0.7, 8.4], lookAt: [0, 0.1, 0] },
  { section: 'technology', at: 0.28, position: [3.6, 1.9, 5.9], lookAt: [0, 0.15, 0] },
  { section: 'interactive', at: 0.52, position: [0, 0.4, 6.8], lookAt: [0, 0, 0] },
  { section: 'performance', at: 0.76, position: [-3.9, 2.4, 6.6], lookAt: [0, 0.2, 0] },
  { section: 'final', at: 1.0, position: [0, 0.9, 9.6], lookAt: [0, 0, 0] },
]

/** Pose associée à une section, ou `null` si la section n'en a pas. */
export function poseForSection(section: SectionId): CameraPose | null {
  return CAMERA_POSES.find((pose) => pose.section === section) ?? null
}

/** Index de pose affiché à l'écran, à partir de 1. */
export function poseIndex(section: SectionId): number {
  return CAMERA_POSES.findIndex((pose) => pose.section === section) + 1
}

/** Formate une position en coordonnées courtes, façon relevé d'instrument. */
export function formatPose(position: readonly [number, number, number]): string {
  const [x, y, z] = position
  return `x${x.toFixed(1)} y${y.toFixed(1)} z${z.toFixed(1)}`
}

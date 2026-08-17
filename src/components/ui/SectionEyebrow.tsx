import type { SectionId } from '../../types'
import { formatPose, poseForSection, poseIndex } from '../../utils/cameraPath'

interface SectionEyebrowProps {
  section: SectionId
  /** Intitulé lisible de la section. */
  children: string
}

/**
 * Intitulé de section.
 *
 * L'index et les coordonnées affichés ne sont pas une numérotation décorative :
 * ils proviennent de `CAMERA_POSES`, la table qui pilote réellement la caméra.
 * Le numéro désigne la pose où se trouve la caméra pendant qu'on lit ce texte,
 * et les coordonnées sont celles de cette pose. La page contient exactement
 * autant de sections que la trajectoire a de poses — la séquence est donc
 * réelle, et c'est ce qui autorise à la numéroter.
 */
export function SectionEyebrow({ section, children }: SectionEyebrowProps) {
  const pose = poseForSection(section)
  const index = poseIndex(section)

  return (
    <p className="eyebrow" data-reveal>
      <span className="eyebrow__index">{String(index).padStart(2, '0')}</span>
      <span className="eyebrow__label">{children}</span>
      {pose ? (
        <span className="eyebrow__pose" aria-hidden="true">
          pose {formatPose(pose.position)}
        </span>
      ) : null}
    </p>
  )
}

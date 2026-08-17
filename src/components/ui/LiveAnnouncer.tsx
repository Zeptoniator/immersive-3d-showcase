import { useExperienceStore } from '../../store/useExperienceStore'

/**
 * Zone d'annonce discrète.
 *
 * Les changements importants qui n'ont pas d'équivalent textuel immédiat
 * (bascule de qualité automatique, sélection d'un point d'intérêt, mise en
 * pause des animations) y sont poussés via `announce()` du store et lus par les
 * lecteurs d'écran sans interrompre la navigation.
 */
export function LiveAnnouncer() {
  const announcement = useExperienceStore((state) => state.announcement)

  return (
    <div className="live-region" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  )
}

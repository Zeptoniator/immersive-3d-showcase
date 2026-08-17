import { Html } from '@react-three/drei'
import { HOTSPOTS } from '../../utils/content'
import { useExperienceStore } from '../../store/useExperienceStore'

/**
 * Marqueurs HTML ancrés sur l'objet 3D.
 *
 * Ils doublent la liste de boutons de la section Exploration — jamais ils ne la
 * remplacent : l'information reste accessible sans WebGL et au clavier. Ils ne
 * sont affichés que lorsque la section Exploration est visible, afin de ne pas
 * encombrer le hero ni gêner le défilement.
 */
export function HotspotMarkers() {
  const activeSection = useExperienceStore((state) => state.activeSection)
  const selectedHotspotId = useExperienceStore((state) => state.selectedHotspotId)
  const selectHotspot = useExperienceStore((state) => state.selectHotspot)

  if (activeSection !== 'interactive') return null

  return (
    <>
      {HOTSPOTS.map((hotspot) => (
        <Html
          key={hotspot.id}
          position={hotspot.position}
          center
          // La couche 3D est en `pointer-events: none` : le marqueur réactive
          // explicitement les interactions pour lui seul.
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[10, 0]}
        >
          <button
            type="button"
            className="hotspot-marker"
            aria-pressed={selectedHotspotId === hotspot.id}
            onClick={() => selectHotspot(hotspot.id)}
            // Les marqueurs sont un raccourci visuel ; la liste de la section
            // reste le chemin de navigation clavier officiel.
            tabIndex={-1}
          >
            <span className="hotspot-marker__dot" aria-hidden="true" />
            <span className="hotspot-marker__label">{hotspot.label}</span>
          </button>
        </Html>
      ))}
    </>
  )
}

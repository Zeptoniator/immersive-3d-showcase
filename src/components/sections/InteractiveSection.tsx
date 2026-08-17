import { useCallback, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { scrollState } from '../../store/scrollState'
import { useExperienceStore } from '../../store/useExperienceStore'
import { HOTSPOTS } from '../../utils/content'
import { clamp } from '../../utils/math'
import { SectionEyebrow } from '../ui/SectionEyebrow'

/** Amplitude maximale du basculement vertical, en radians. */
const PITCH_LIMIT = 0.55
/** Bornes du zoom manuel, exprimées en unités de distance caméra. */
const ZOOM_MIN = -1.6
const ZOOM_MAX = 3.6
const ZOOM_STEP = 0.45
/** Pas de rotation au clavier, en radians. */
const KEY_YAW_STEP = 0.18
const KEY_PITCH_STEP = 0.1

/**
 * Section Exploration : contrôle direct de la scène.
 *
 * Point clé du confort mobile : la surface de contrôle porte
 * `touch-action: pan-y`. Le geste vertical reste donc confié au défilement de la
 * page — impossible de rester piégé dans la scène — tandis que le geste
 * horizontal fait pivoter l'objet. La molette n'est volontairement pas
 * interceptée, pour la même raison ; le zoom passe par des boutons explicites et
 * par le clavier.
 */
export function InteractiveSection() {
  const selectedHotspotId = useExperienceStore((state) => state.selectedHotspotId)
  const selectHotspot = useExperienceStore((state) => state.selectHotspot)
  const animationsPaused = useExperienceStore((state) => state.animationsPaused)
  const toggleAnimations = useExperienceStore((state) => state.toggleAnimations)
  const markInteracted = useExperienceStore((state) => state.markInteracted)
  const announce = useExperienceStore((state) => state.announce)

  const [dragging, setDragging] = useState(false)
  const pointerOrigin = useRef<{ x: number; y: number; type: string } | null>(null)

  const selectedHotspot = HOTSPOTS.find((hotspot) => hotspot.id === selectedHotspotId) ?? null

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointerOrigin.current = { x: event.clientX, y: event.clientY, type: event.pointerType }
      setDragging(true)
      markInteracted()
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [markInteracted]
  )

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const origin = pointerOrigin.current
    if (!origin) return

    const deltaX = event.clientX - origin.x
    const deltaY = event.clientY - origin.y
    pointerOrigin.current = { x: event.clientX, y: event.clientY, type: origin.type }

    scrollState.orbitYaw += deltaX * 0.005
    // Au doigt, le mouvement vertical appartient au défilement de la page :
    // seul le pointeur fin (souris, stylet) pilote le basculement.
    if (origin.type !== 'touch') {
      scrollState.orbitPitch = clamp(
        scrollState.orbitPitch + deltaY * 0.004,
        -PITCH_LIMIT,
        PITCH_LIMIT
      )
    }
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerOrigin.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const handled = true
      switch (event.key) {
        case 'ArrowLeft':
          scrollState.orbitYaw -= KEY_YAW_STEP
          break
        case 'ArrowRight':
          scrollState.orbitYaw += KEY_YAW_STEP
          break
        case 'ArrowUp':
          scrollState.orbitPitch = clamp(
            scrollState.orbitPitch + KEY_PITCH_STEP,
            -PITCH_LIMIT,
            PITCH_LIMIT
          )
          break
        case 'ArrowDown':
          scrollState.orbitPitch = clamp(
            scrollState.orbitPitch - KEY_PITCH_STEP,
            -PITCH_LIMIT,
            PITCH_LIMIT
          )
          break
        case '+':
        case '=':
          scrollState.zoom = clamp(scrollState.zoom + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
          break
        case '-':
          scrollState.zoom = clamp(scrollState.zoom - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX)
          break
        default:
          return
      }

      if (handled) {
        // Les flèches ne doivent pas faire défiler la page pendant le pilotage.
        event.preventDefault()
        markInteracted()
      }
    },
    [markInteracted]
  )

  const zoomBy = useCallback((amount: number) => {
    scrollState.zoom = clamp(scrollState.zoom + amount, ZOOM_MIN, ZOOM_MAX)
  }, [])

  const resetCamera = useCallback(() => {
    scrollState.orbitYaw = 0
    scrollState.orbitPitch = 0
    scrollState.zoom = 0
    announce('Caméra réinitialisée.')
  }, [announce])

  const handleSelect = useCallback(
    (id: string) => {
      const next = selectedHotspotId === id ? null : id
      selectHotspot(next)
      const hotspot = HOTSPOTS.find((item) => item.id === id)
      announce(
        next && hotspot ? `Point d'intérêt sélectionné : ${hotspot.title}.` : 'Sélection effacée.'
      )
    },
    [announce, selectHotspot, selectedHotspotId]
  )

  const handleToggleAnimations = useCallback(() => {
    toggleAnimations()
    announce(
      animationsPaused ? 'Animations automatiques relancées.' : 'Animations automatiques en pause.'
    )
  }, [animationsPaused, announce, toggleAnimations])

  return (
    <section id="interactive" className="section" aria-labelledby="interactive-title">
      <div className="section__inner">
        <SectionEyebrow section="interactive">Exploration</SectionEyebrow>
        <h2 className="section-title" id="interactive-title" data-reveal>
          Prenez les commandes
        </h2>
        <p className="section-lead" data-reveal>
          Faites glisser horizontalement pour faire pivoter l&apos;objet, ajustez la distance, puis
          sélectionnez un point d&apos;intérêt pour afficher sa fiche. Le défilement vertical de la
          page reste toujours prioritaire.
        </p>

        <div className="interactive__layout">
          {/* Colonne de gauche : les contenus opaques. La caméra décale l'objet
              vers la droite du cadre, la surface de contrôle est donc placée en
              regard, sur la colonne de droite. L'ordre du DOM suit l'ordre
              visuel : la navigation au clavier reste cohérente. */}
          <div>
            <h3 className="panel__title" id="hotspot-list-title">
              Points d&apos;intérêt
            </h3>
            <ul className="hotspot-list" aria-labelledby="hotspot-list-title">
              {HOTSPOTS.map((hotspot) => (
                <li key={hotspot.id}>
                  <button
                    type="button"
                    className="hotspot-list__button"
                    aria-pressed={selectedHotspotId === hotspot.id}
                    data-testid={`hotspot-${hotspot.id}`}
                    onClick={() => handleSelect(hotspot.id)}
                  >
                    {hotspot.label}
                  </button>
                </li>
              ))}
            </ul>

            <article className="panel" data-testid="hotspot-card">
              {selectedHotspot ? (
                <>
                  <span className="hotspot-card__metric">{selectedHotspot.metric}</span>
                  <h4 className="panel__title">{selectedHotspot.title}</h4>
                  <p className="panel__text">{selectedHotspot.description}</p>
                </>
              ) : (
                <>
                  <h4 className="panel__title">Aucun point sélectionné</h4>
                  <p className="panel__text">
                    Choisissez un élément dans la liste ci-dessus pour afficher sa description
                    technique. Sur grand écran, les marqueurs posés directement sur l&apos;objet
                    mènent au même contenu.
                  </p>
                </>
              )}
            </article>
          </div>

          <div>
            <div
              className="stage-control"
              data-dragging={dragging}
              data-testid="stage-control"
              role="group"
              aria-label="Contrôle de la scène 3D : flèches pour pivoter, plus et moins pour zoomer"
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleKeyDown}
            >
              <p className="stage-control__hint">
                Glisser pour pivoter · Flèches au clavier · + / − pour zoomer
              </p>
            </div>

            <div className="stage-toolbar">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => zoomBy(ZOOM_STEP)}
                data-testid="zoom-in"
              >
                <ZoomIn size={16} aria-hidden="true" />
                Rapprocher
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => zoomBy(-ZOOM_STEP)}
                data-testid="zoom-out"
              >
                <ZoomOut size={16} aria-hidden="true" />
                Éloigner
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={resetCamera}
                data-testid="reset-camera"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Réinitialiser la caméra
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleToggleAnimations}
                aria-pressed={animationsPaused}
                data-testid="toggle-animations"
              >
                {animationsPaused ? (
                  <Play size={16} aria-hidden="true" />
                ) : (
                  <Pause size={16} aria-hidden="true" />
                )}
                {animationsPaused ? 'Reprendre les animations' : 'Mettre en pause les animations'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { scrollState } from '../../store/scrollState'
import { useExperienceStore } from '../../store/useExperienceStore'
import { SECTIONS } from '../../utils/content'
import { QUALITY_LABELS } from '../../utils/quality'
import { smoothstep } from '../../utils/math'

/** Fenêtre de lissage de la fréquence d'images, en secondes. */
const FPS_WINDOW = 0.5
/** En deçà, la valeur passe en ambre : la fluidité s'écarte du nominal. */
const FPS_NOMINAL = 50

/**
 * Bandeau de relevé — l'élément signature du site.
 *
 * Chaque valeur affichée est **réellement mesurée**, jamais simulée : la pose
 * courante vient de l'observateur de sections, la distance est celle que
 * `CameraRig` vient d'appliquer à la caméra, l'ouverture de coque est la même
 * variable que celle qui écarte les panneaux, et la fréquence d'images est
 * comptée ici même. C'est la contrepartie honnête des indicateurs fictifs de la
 * section Performances : ceux-là décrivent un produit imaginaire, ceux-ci
 * décrivent ce que la machine fait à l'instant.
 *
 * Le bandeau ne provoque aucun rendu React : la boucle écrit directement dans
 * le `textContent` des cellules. Trente rendus par seconde d'un arbre React
 * pour afficher quatre nombres serait exactement le genre de gaspillage que la
 * page prétend éviter.
 *
 * Il est masqué aux lecteurs d'écran (`aria-hidden`) : une zone qui change
 * plusieurs fois par seconde n'a rien à leur apporter, et toutes les
 * informations utiles qu'elle résume — section courante, niveau de qualité —
 * sont déjà exposées en clair ailleurs dans la page.
 */
export function TelemetryReadout() {
  const poseRef = useRef<HTMLSpanElement>(null)
  const distanceRef = useRef<HTMLSpanElement>(null)
  const shellRef = useRef<HTMLSpanElement>(null)
  const fpsRef = useRef<HTMLSpanElement>(null)

  const resolvedQuality = useExperienceStore((state) => state.resolvedQuality)
  const webglAvailable = useExperienceStore((state) => state.webglAvailable)
  const activeSection = useExperienceStore((state) => state.activeSection)

  // Le libellé de pose change rarement : il passe par React, contrairement aux
  // valeurs continues.
  const poseIndex = SECTIONS.findIndex((section) => section.id === activeSection) + 1

  useEffect(() => {
    let frame = 0
    let elapsed = 0
    let frames = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.25)
      last = now

      elapsed += delta
      frames += 1

      if (elapsed >= FPS_WINDOW) {
        const fps = Math.round(frames / elapsed)
        elapsed = 0
        frames = 0

        const fpsCell = fpsRef.current
        if (fpsCell) {
          fpsCell.textContent = String(fps).padStart(2, '0')
          fpsCell.dataset.state = fps < FPS_NOMINAL ? 'warn' : 'nominal'
        }
      }

      const distanceCell = distanceRef.current
      if (distanceCell) {
        distanceCell.textContent =
          scrollState.cameraDistance > 0 ? scrollState.cameraDistance.toFixed(2) : '——'
      }

      const shellCell = shellRef.current
      if (shellCell) {
        const opening = Math.round(smoothstep(scrollState.technology * 1.6 - 0.15) * 100)
        shellCell.textContent = `${String(opening).padStart(3, '0')}%`
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const cell = poseRef.current
    if (cell) cell.textContent = `${String(poseIndex).padStart(2, '0')}/0${SECTIONS.length}`
  }, [poseIndex])

  const tierIsNominal = resolvedQuality === 'high'

  return (
    <aside className="readout" aria-hidden="true" data-testid="telemetry-readout">
      <span className="readout__brand">NOVA CORE · RELEVÉ</span>

      <span className="readout__cell">
        <span className="readout__key">pose</span>
        <span className="readout__value" ref={poseRef}>
          01/05
        </span>
      </span>

      <span className="readout__cell readout__cell--wide">
        <span className="readout__key">dist</span>
        <span className="readout__value" ref={distanceRef}>
          ——
        </span>
        <span className="readout__unit">u</span>
      </span>

      <span className="readout__cell readout__cell--wide">
        <span className="readout__key">coque</span>
        <span className="readout__value" ref={shellRef}>
          000%
        </span>
      </span>

      <span className="readout__cell">
        <span className="readout__key">qualité</span>
        <span className="readout__value" data-state={tierIsNominal ? 'nominal' : 'warn'}>
          {webglAvailable === false ? 'repli' : QUALITY_LABELS[resolvedQuality].toLowerCase()}
        </span>
      </span>

      <span className="readout__cell">
        <span className="readout__key">ips</span>
        <span className="readout__value" ref={fpsRef} data-state="nominal">
          ——
        </span>
      </span>
    </aside>
  )
}

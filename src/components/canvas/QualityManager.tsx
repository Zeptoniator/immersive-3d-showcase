import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../../store/useExperienceStore'
import { degradeQuality, detectQualityLevel, readDeviceSignals } from '../../utils/quality'

/**
 * Délai d'échauffement avant toute mesure, en secondes.
 *
 * Les premières images d'une scène WebGL ne sont jamais représentatives :
 * compilation des shaders, téléversement des géométries, mise en cache des
 * programmes, et souvent chargement concurrent du reste de la page. Mesurer
 * pendant cette phase conduirait à rétrograder systématiquement, y compris sur
 * une machine parfaitement capable.
 */
const WARMUP_DELAY = 3
/** Fenêtre de mesure de la fluidité, en secondes. */
const SAMPLE_WINDOW = 1.5
/** En deçà de ce nombre d'images par seconde, la qualité est jugée insuffisante. */
const FPS_FLOOR = 38
/** Nombre de fenêtres consécutives sous le seuil avant de rétrograder. */
const CONSECUTIVE_BAD_WINDOWS = 3

/**
 * Arbitre du niveau de qualité effectif.
 *
 * Deux mécanismes se complètent :
 *
 * 1. une estimation initiale à partir des caractéristiques de l'appareil ;
 * 2. une surveillance continue de la fluidité réelle, qui rétrograde le niveau
 *    si l'estimation s'avère trop optimiste.
 *
 * Le système ne remonte jamais automatiquement : une oscillation entre deux
 * niveaux serait bien plus gênante qu'un rendu légèrement trop prudent.
 * L'utilisateur garde la main via le sélecteur manuel, qui neutralise
 * entièrement cette logique.
 */
export function QualityManager() {
  const qualityPreference = useExperienceStore((state) => state.qualityPreference)
  const resolvedQuality = useExperienceStore((state) => state.resolvedQuality)
  const setResolvedQuality = useExperienceStore((state) => state.setResolvedQuality)
  const announce = useExperienceStore((state) => state.announce)

  const accumulator = useRef(0)
  const frames = useRef(0)
  const badWindows = useRef(0)
  const warmup = useRef(0)

  // --- Estimation initiale, réévaluée au redimensionnement -----------------
  useEffect(() => {
    if (qualityPreference !== 'auto') {
      setResolvedQuality(qualityPreference)
      return
    }

    const apply = () => setResolvedQuality(detectQualityLevel(readDeviceSignals()))
    apply()
    // Tout changement de réglage relance l'échauffement : les shaders sont
    // recompilés et les premières images redeviennent non représentatives.
    badWindows.current = 0
    warmup.current = 0

    /*
     * Relectures différées.
     *
     * La largeur de fenêtre n'est pas fiable au tout premier rendu : une
     * WebView Android part d'une zone d'affichage large avant d'appliquer la
     * balise `viewport`, et un navigateur mobile la fait varier au repli de sa
     * barre d'adresse. Mesuré sur appareil : le premier échantillon voyait plus
     * de 1000 px de large sur un téléphone, et le niveau restait bloqué sur
     * cette estimation trop optimiste faute d'événement `resize` ultérieur.
     */
    const settleTimers = [400, 1500].map((delay) => window.setTimeout(apply, delay))

    // Un passage portrait → paysage ou un redimensionnement de fenêtre change
    // significativement la charge de rendu.
    let timeout = 0
    const onResize = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(apply, 250)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      settleTimers.forEach(window.clearTimeout)
      window.clearTimeout(timeout)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [qualityPreference, setResolvedQuality])

  // --- Rappel sur la libération des ressources ------------------------------
  // Le renderer lui-même est démonté par React Three Fiber au retrait du
  // `Canvas` : le disposer ici casserait le remontage double du StrictMode.
  // Les objets créés à la main (géométries et matériaux de `NovaCore`) sont en
  // revanche libérés explicitement dans leur propre composant.

  // --- Surveillance de la fluidité -----------------------------------------
  useFrame((_, delta) => {
    if (qualityPreference !== 'auto' || resolvedQuality === 'low') return

    // Phase d'échauffement : on laisse la scène se stabiliser avant de juger.
    if (warmup.current < WARMUP_DELAY) {
      warmup.current += delta
      return
    }

    accumulator.current += delta
    frames.current += 1

    if (accumulator.current < SAMPLE_WINDOW) return

    const fps = frames.current / accumulator.current
    accumulator.current = 0
    frames.current = 0

    if (fps >= FPS_FLOOR) {
      badWindows.current = 0
      return
    }

    badWindows.current += 1
    if (badWindows.current < CONSECUTIVE_BAD_WINDOWS) return

    badWindows.current = 0
    const next = degradeQuality(resolvedQuality)
    if (next === resolvedQuality) return

    setResolvedQuality(next)
    announce(
      `Fluidité insuffisante détectée : la qualité graphique est passée en mode ${
        next === 'medium' ? 'moyen' : 'faible'
      }.`
    )
  })

  return null
}

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
     * Les signaux d'entrée ne sont pas fiables au tout premier rendu, et rien
     * ne prévient toujours de leur mise au point. Trois mécanismes se
     * complètent, chacun pour ce qu'il couvre réellement.
     */
    let timeout = 0
    const scheduleApply = () => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(apply, 250)
    }

    /*
     * 1. Changements de zone d'affichage.
     *
     * Mesuré dans une WebView Android : à la première ligne de script exécutée,
     * `innerWidth` vaut 980 px — la zone d'affichage large par défaut — et ne
     * descend à la largeur réelle de l'appareil (384 px) qu'une centaine de
     * millisecondes plus tard, sans émettre d'événement `resize`. Un navigateur
     * mobile produit le même effet au repli de sa barre d'adresse. Un
     * `ResizeObserver` sur l'élément racine, lui, voit ces changements.
     */
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleApply) : null
    observer?.observe(document.documentElement)

    // 2. Vrais changements de préférence ou d'orientation en cours de session.
    const queries =
      typeof window.matchMedia === 'function'
        ? ['(prefers-reduced-motion: reduce)', '(pointer: coarse)'].map((query) =>
            window.matchMedia(query)
          )
        : []
    queries.forEach((query) => query.addEventListener('change', scheduleApply))
    window.addEventListener('resize', scheduleApply)
    window.addEventListener('orientationchange', scheduleApply)

    /*
     * 3. Relectures différées.
     *
     * Mesuré sur le même appareil : les requêtes média d'une WebView renvoient
     * une valeur erronée au démarrage puis se corrigent après le premier rendu,
     * **sans** émettre d'événement `change` — c'est ce qui affichait le site en
     * sombre sur un téléphone réglé en clair. Une estimation prise pendant cette
     * fenêtre resterait figée pour toute la session : un téléphone à 120 images
     * par seconde était classé « faible », alors qu'un simple rechargement de la
     * page donnait « moyenne ». Ni l'observateur ni les écouteurs ci-dessus ne
     * couvrent ce cas, puisqu'aucun événement n'est émis et qu'aucune taille ne
     * change.
     */
    const settleTimers = [600, 2000].map((delay) => window.setTimeout(apply, delay))

    return () => {
      observer?.disconnect()
      settleTimers.forEach(window.clearTimeout)
      queries.forEach((query) => query.removeEventListener('change', scheduleApply))
      window.clearTimeout(timeout)
      window.removeEventListener('resize', scheduleApply)
      window.removeEventListener('orientationchange', scheduleApply)
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

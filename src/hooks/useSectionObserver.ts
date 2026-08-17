import { useEffect } from 'react'
import { useExperienceStore } from '../store/useExperienceStore'
import { SECTIONS } from '../utils/content'
import type { SectionId } from '../types'

/**
 * Met à jour la section active dans le store à partir d'un IntersectionObserver.
 *
 * Un observer est nettement moins coûteux qu'un écouteur `scroll` : il ne se
 * déclenche qu'aux franchissements de seuil.
 */
export function useSectionObserver(): void {
  const setActiveSection = useExperienceStore((state) => state.setActiveSection)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null
    )
    if (elements.length === 0) return

    // On retient la section dont la part visible est la plus grande, ce qui
    // évite les oscillations quand deux sections se chevauchent.
    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestId) setActiveSection(bestId as SectionId)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-10% 0px -10% 0px' }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [setActiveSection])
}

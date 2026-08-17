import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from '../store/scrollState'

gsap.registerPlugin(ScrollTrigger)

/**
 * Met en place la chorégraphie liée au défilement.
 *
 * Deux familles d'animations cohabitent :
 *
 * 1. des `scrub` GSAP qui interpolent les champs de `scrollState` — ces valeurs
 *    sont ensuite lues par la scène 3D dans `useFrame` ;
 * 2. des révélations de texte classiques sur les éléments `[data-reveal]`.
 *
 * Tout est créé dans un `gsap.context` : un seul `revert()` au démontage suffit
 * à tuer les tweens et les ScrollTriggers, ce qui évite les doublons lors des
 * remontages (React StrictMode, navigation par le routeur).
 *
 * @param enabled       la chorégraphie doit-elle être installée
 * @param reducedMotion respecte `prefers-reduced-motion`
 */
export function useScrollChoreography(enabled: boolean, reducedMotion: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const context = gsap.context(() => {
      // --- Progression globale de la page -------------------------------
      gsap.to(scrollState, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: reducedMotion ? true : 0.6,
          invalidateOnRefresh: true,
        },
      })

      // --- Progression interne de chaque section ------------------------
      const sectionKeys = ['technology', 'interactive', 'performance', 'final'] as const
      for (const key of sectionKeys) {
        const element = document.getElementById(key)
        if (!element) continue

        gsap.fromTo(
          scrollState,
          { [key]: 0 },
          {
            [key]: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: reducedMotion ? true : 0.6,
              invalidateOnRefresh: true,
            },
          }
        )
      }

      // --- Révélation des contenus --------------------------------------
      const revealTargets = gsap.utils.toArray<HTMLElement>('[data-reveal]')

      if (reducedMotion) {
        // Mouvement réduit : le contenu apparaît sans déplacement ni délai.
        gsap.set(revealTargets, { opacity: 1, y: 0, clearProps: 'transform' })
        return
      }

      for (const target of revealTargets) {
        gsap.fromTo(
          target,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: target,
              // `start` en pourcentage : aucune dépendance à une hauteur fixe,
              // le comportement reste correct après redimensionnement.
              start: 'top 88%',
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true,
            },
          }
        )
      }
    })

    // Le contenu et les polices peuvent modifier la hauteur du document après
    // le premier rendu : on recalcule les positions une fois tout stabilisé.
    const refresh = () => ScrollTrigger.refresh()
    const refreshTimeout = window.setTimeout(refresh, 300)
    window.addEventListener('orientationchange', refresh)
    if (document.fonts?.ready) void document.fonts.ready.then(refresh)

    return () => {
      window.clearTimeout(refreshTimeout)
      window.removeEventListener('orientationchange', refresh)
      context.revert()
    }
  }, [enabled, reducedMotion])
}

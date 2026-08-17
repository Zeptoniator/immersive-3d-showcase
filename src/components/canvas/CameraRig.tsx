import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../store/scrollState'
import { clamp, damp } from '../../utils/math'

/**
 * Étape de caméra pilotée par le défilement, le pointeur et l'utilisateur.
 *
 * La caméra n'est jamais positionnée directement : une cible est calculée à
 * chaque image puis atteinte par amortissement exponentiel. Le résultat est
 * identique quel que soit le taux de rafraîchissement et le retour en arrière
 * dans le défilement reste fluide, sans à-coup.
 */

interface Keyframe {
  /** Progression globale à laquelle cette pose est atteinte. */
  at: number
  position: [number, number, number]
  lookAt: [number, number, number]
}

/** Trajectoire cinématique, du hero jusqu'à la section finale. */
const KEYFRAMES: ReadonlyArray<Keyframe> = [
  { at: 0.0, position: [0.4, 0.7, 8.4], lookAt: [0, 0.1, 0] },
  { at: 0.28, position: [3.6, 1.9, 5.9], lookAt: [0, 0.15, 0] },
  { at: 0.52, position: [0, 0.4, 6.8], lookAt: [0, 0, 0] },
  { at: 0.76, position: [-3.9, 2.4, 6.6], lookAt: [0, 0.2, 0] },
  { at: 1.0, position: [0, 0.9, 9.6], lookAt: [0, 0, 0] },
]

/**
 * Indice de la première pose du segment contenant `progress`.
 * Fonction pure, sans allocation : appelée à chaque image.
 */
function findSegmentIndex(progress: number): number {
  for (let index = 0; index < KEYFRAMES.length - 1; index += 1) {
    if (progress <= (KEYFRAMES[index + 1] as Keyframe).at) return index
  }
  return KEYFRAMES.length - 2
}

interface CameraRigProps {
  reducedMotion: boolean
}

export function CameraRig({ reducedMotion }: CameraRigProps) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const hasInitialised = useRef(false)

  // Vecteurs de travail alloués une seule fois : `useFrame` n'alloue jamais.
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      lookAt: new THREE.Vector3(),
      current: new THREE.Vector3(),
      orbit: new THREE.Vector3(),
      view: new THREE.Vector3(),
      spherical: new THREE.Spherical(),
    }),
    []
  )

  const viewportAspect = useThree((state) => state.viewport.aspect)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const progress = clamp(scrollState.progress, 0, 1)

    // --- Interpolation le long de la trajectoire ----------------------------
    const segment = findSegmentIndex(progress)
    const previous = KEYFRAMES[segment] as Keyframe
    const next = KEYFRAMES[segment + 1] as Keyframe

    const span = next.at - previous.at
    const localT = span === 0 ? 0 : clamp((progress - previous.at) / span, 0, 1)

    scratch.position.set(...previous.position).lerp(scratch.current.set(...next.position), localT)
    scratch.lookAt.set(...previous.lookAt).lerp(scratch.current.set(...next.lookAt), localT)

    // Mouvement réduit : la trajectoire est écrasée vers la pose d'accueil pour
    // éviter les déplacements amples pouvant provoquer un inconfort.
    if (reducedMotion) {
      scratch.position.lerp(scratch.current.set(0.4, 0.7, 8.4), 0.72)
      scratch.lookAt.lerp(scratch.current.set(0, 0.1, 0), 0.72)
    }

    // --- Orbite et zoom pilotés par l'utilisateur ---------------------------
    // Ils sont appliqués en coordonnées sphériques autour du point visé, ce qui
    // garde l'objet centré quelle que soit la position sur la trajectoire.
    scratch.orbit.copy(scratch.position).sub(scratch.lookAt)
    scratch.spherical.setFromVector3(scratch.orbit)
    scratch.spherical.theta += scrollState.orbitYaw
    scratch.spherical.phi = clamp(
      scratch.spherical.phi - scrollState.orbitPitch,
      0.42,
      Math.PI - 0.42
    )
    // En portrait, le cadre est étroit : sans recul supplémentaire l'objet
    // occuperait toute la largeur et passerait derrière chaque paragraphe.
    const portrait = viewportAspect < 1
    // Zoom borné : l'objet ne peut être ni traversé ni perdu de vue.
    scratch.spherical.radius = clamp(
      scratch.spherical.radius - scrollState.zoom + (portrait ? 3.6 : 0),
      3.2,
      16
    )
    scratch.orbit.setFromSpherical(scratch.spherical)
    scratch.position.copy(scratch.lookAt).add(scratch.orbit)

    // --- Parallaxe au pointeur ---------------------------------------------
    const parallax = reducedMotion ? 0.12 : 0.5
    scratch.position.x += scrollState.pointerX * parallax
    scratch.position.y += -scrollState.pointerY * parallax * 0.6

    // --- Application amortie ------------------------------------------------
    if (!hasInitialised.current) {
      camera.position.copy(scratch.position)
      hasInitialised.current = true
    } else {
      camera.position.x = damp(camera.position.x, scratch.position.x, 3.2, delta)
      camera.position.y = damp(camera.position.y, scratch.position.y, 3.2, delta)
      camera.position.z = damp(camera.position.z, scratch.position.z, 3.2, delta)
    }

    // --- Cadrage horizontal --------------------------------------------------
    // Sur un écran large, la caméra vise légèrement à gauche de l'objet : celui-ci
    // se décale vers la droite du cadre et laisse la colonne de texte libre. Le
    // pivot d'orbite, lui, reste sur l'objet — la rotation manuelle n'est donc
    // pas déportée. Sur mobile, où le texte est adossé au bas de l'écran,
    // l'objet reste centré.
    scratch.view.copy(scratch.lookAt)
    scratch.view.x += viewportAspect > 1.3 ? -1.9 : 0
    // En portrait, viser plus bas remonte l'objet dans le cadre : il occupe la
    // bande haute de l'écran, au-dessus du bloc de texte.
    scratch.view.y -= portrait ? 1.15 : 0

    camera.lookAt(scratch.view)
    invalidate()
  })

  return null
}

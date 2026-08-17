import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import type { QualitySettings } from '../../types'
import { scrollState } from '../../store/scrollState'
import { damp, mapRange } from '../../utils/math'

interface SceneLightsProps {
  settings: QualitySettings
}

/**
 * Éclairage cinématique en trois points, complété par deux liserés colorés.
 *
 * L'intensité évolue avec le défilement : ambiance sourde sur le hero, éclairage
 * technique plus franc sur la vue éclatée, contre-jour violet en fin de page.
 * L'interpolation passe par `damp`, donc indépendante du taux de rafraîchissement.
 */
export function SceneLights({ settings }: SceneLightsProps) {
  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const cyanRimRef = useRef<THREE.PointLight>(null)
  const violetRimRef = useRef<THREE.PointLight>(null)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const progress = scrollState.progress

    const keyLight = keyLightRef.current
    if (keyLight) {
      keyLight.intensity = damp(keyLight.intensity, mapRange(progress, 0, 0.45, 1.6, 3.1), 3, delta)
    }

    const cyanRim = cyanRimRef.current
    if (cyanRim) {
      cyanRim.intensity = damp(cyanRim.intensity, mapRange(progress, 0.1, 0.6, 18, 42), 3, delta)
    }

    const violetRim = violetRimRef.current
    if (violetRim) {
      violetRim.intensity = damp(violetRim.intensity, mapRange(progress, 0.55, 1, 12, 46), 3, delta)
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} color="#5f7ec9" />
      <hemisphereLight args={['#4d7dff', '#050912', 0.55]} />

      <directionalLight
        ref={keyLightRef}
        position={[4.5, 6.5, 5]}
        intensity={1.6}
        color="#dce8ff"
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0015}
        shadow-normalBias={0.03}
      />

      {/* Liseré froid côté droit, contre-jour violet côté gauche. */}
      <pointLight
        ref={cyanRimRef}
        position={[3.4, -0.6, -3.2]}
        intensity={18}
        color="#35e0ff"
        distance={18}
        decay={2}
      />
      <pointLight
        ref={violetRimRef}
        position={[-3.8, 1.8, -2.4]}
        intensity={12}
        color="#a855f7"
        distance={18}
        decay={2}
      />
      <pointLight position={[0, 0, 0]} intensity={6} color="#7fd8ff" distance={5} decay={2} />
    </>
  )
}

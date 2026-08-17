import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import type { QualitySettings } from '../../types'
import type { ScenePalette } from '../../utils/scenePalette'
import { scrollState } from '../../store/scrollState'
import { damp, mapRange } from '../../utils/math'

interface SceneLightsProps {
  settings: QualitySettings
  palette: ScenePalette
}

/**
 * Éclairage cinématique en trois points, complété par deux liserés colorés.
 *
 * L'intensité évolue avec le défilement : ambiance sourde sur le hero, éclairage
 * technique plus franc sur la vue éclatée, contre-jour violet en fin de page.
 * L'interpolation passe par `damp`, donc indépendante du taux de rafraîchissement.
 *
 * Les valeurs viennent de la palette de thème : en clair, l'ambiante monte et
 * les liserés colorés retombent — sur un fond blanc, un liseré à pleine
 * puissance délave l'objet au lieu de le détacher.
 */
export function SceneLights({ settings, palette }: SceneLightsProps) {
  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const cyanRimRef = useRef<THREE.PointLight>(null)
  const violetRimRef = useRef<THREE.PointLight>(null)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const progress = scrollState.progress

    const keyLight = keyLightRef.current
    if (keyLight) {
      const [from, to] = palette.keyLightRange
      keyLight.intensity = damp(keyLight.intensity, mapRange(progress, 0, 0.45, from, to), 3, delta)
    }

    const cyanRim = cyanRimRef.current
    if (cyanRim) {
      const [from, to] = palette.cyanRimRange
      cyanRim.intensity = damp(cyanRim.intensity, mapRange(progress, 0.1, 0.6, from, to), 3, delta)
    }

    const violetRim = violetRimRef.current
    if (violetRim) {
      const [from, to] = palette.violetRimRange
      violetRim.intensity = damp(
        violetRim.intensity,
        mapRange(progress, 0.55, 1, from, to),
        3,
        delta
      )
    }
  })

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} color={palette.ambientColor} />
      <hemisphereLight
        args={[palette.hemisphereSky, palette.hemisphereGround, palette.hemisphereIntensity]}
      />

      <directionalLight
        ref={keyLightRef}
        position={[4.5, 6.5, 5]}
        intensity={palette.keyLightRange[0]}
        color={palette.keyLightColor}
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
        intensity={palette.cyanRimRange[0]}
        color={palette.cyanRimColor}
        distance={18}
        decay={2}
      />
      <pointLight
        ref={violetRimRef}
        position={[-3.8, 1.8, -2.4]}
        intensity={palette.violetRimRange[0]}
        color={palette.violetRimColor}
        distance={18}
        decay={2}
      />
      <pointLight
        position={[0, 0, 0]}
        intensity={palette.coreLightIntensity}
        color={palette.coreEmissive}
        distance={5}
        decay={2}
      />
    </>
  )
}

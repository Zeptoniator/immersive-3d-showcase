import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { particleFragmentShader, particleVertexShader } from '../../shaders/particleShader'
import { useExperienceStore } from '../../store/useExperienceStore'

interface ParticleFieldProps {
  /** Nombre de particules ; piloté par le niveau de qualité. */
  count: number
  /** Rayon de la coquille sphérique dans laquelle elles sont réparties. */
  radius?: number
}

/**
 * Champ de particules environnant, rendu en un seul appel de dessin.
 *
 * Les attributs sont générés une fois par valeur de `count` : aucune allocation
 * n'a lieu dans la boucle de rendu, seule l'uniforme `uTime` est mise à jour.
 */
export function ParticleField({ count, radius = 16 }: ParticleFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const elapsed = useRef(0)
  const animationsPaused = useExperienceStore((state) => state.animationsPaused)
  const viewportDpr = useThree((state) => state.viewport.dpr)

  const attributes = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const offsets = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      // Répartition sur une coquille sphérique épaisse, plus dense près de
      // l'équateur pour dégager le champ de vision de la caméra.
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const distance = radius * (0.45 + Math.random() * 0.55)

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * distance
      positions[i * 3 + 1] = Math.cos(phi) * distance * 0.55
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * distance

      scales[i] = 0.4 + Math.random() * 1.2
      offsets[i] = Math.random()
    }

    return { positions, scales, offsets }
  }, [count, radius])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 6.5 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0.85 },
      uColorNear: { value: new THREE.Color('#8ce9ff') },
      uColorFar: { value: new THREE.Color('#4a63d8') },
    }),
    []
  )

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return

    // La pause fige le temps du shader sans arrêter la boucle de rendu :
    // la caméra et le défilement restent utilisables.
    if (!animationsPaused) elapsed.current += Math.min(delta, 0.1)

    uniforms.uTime.value = elapsed.current
    uniforms.uPixelRatio.value = viewportDpr
  })

  return (
    // `key` force la reconstruction de la géométrie quand la qualité change ;
    // React Three Fiber libère alors correctement les buffers GPU précédents.
    <points key={count} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[attributes.positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          args={[attributes.scales, 1]}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aOffset"
          args={[attributes.offsets, 1]}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

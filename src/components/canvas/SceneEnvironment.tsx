import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import type { QualitySettings } from '../../types'

interface SceneEnvironmentProps {
  settings: QualitySettings
}

/**
 * Environnement abstrait : brouillard, grille de sol et carte d'environnement.
 *
 * La carte d'environnement est générée localement à partir de `Lightformer`
 * (aucun HDRI téléchargé). Le site reste donc entièrement fonctionnel hors
 * ligne et n'appelle aucun service tiers.
 */
export function SceneEnvironment({ settings }: SceneEnvironmentProps) {
  // Le gridHelper crée ses propres matériaux : on les configure une fois.
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(70, 46, '#2f5bd0', '#16234a')
    const materials = Array.isArray(helper.material) ? helper.material : [helper.material]
    for (const material of materials) {
      material.transparent = true
      material.opacity = 0.35
      material.depthWrite = false
    }
    return helper
  }, [])

  return (
    <>
      {/* Le brouillard exponentiel fond la grille et les particules lointaines
          dans le fond : la profondeur est lisible sans post-traitement. */}
      <fogExp2 attach="fog" args={['#04060e', 0.052]} />

      <primitive object={grid} position={[0, -2.1, 0]} />

      {settings.environmentReflections ? (
        <Environment resolution={128} frames={1}>
          {/* Trois sources larges suffisent à donner du relief aux matériaux
              métalliques et au verre, pour un coût de génération négligeable. */}
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#9fc6ff"
            position={[4, 4, 3]}
            scale={[8, 8, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#35e0ff"
            position={[-5, 0, -4]}
            scale={[7, 5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="ring"
            intensity={1.1}
            color="#a855f7"
            position={[0, -4, 2]}
            scale={[6, 6, 1]}
            target={[0, 0, 0]}
          />
        </Environment>
      ) : null}
    </>
  )
}

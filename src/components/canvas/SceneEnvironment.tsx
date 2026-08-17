import { useEffect, useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import type { QualitySettings } from '../../types'
import type { ScenePalette } from '../../utils/scenePalette'

interface SceneEnvironmentProps {
  settings: QualitySettings
  palette: ScenePalette
}

/**
 * Environnement abstrait : brouillard, grille de sol et carte d'environnement.
 *
 * La carte d'environnement est générée localement à partir de `Lightformer`
 * (aucun HDRI téléchargé). Le site reste donc entièrement fonctionnel hors
 * ligne et n'appelle aucun service tiers.
 *
 * Le brouillard prend la couleur de fond du thème : la grille s'y dissout
 * exactement là où la page reprend, sans arête visible entre la scène et le
 * fond CSS.
 */
export function SceneEnvironment({ settings, palette }: SceneEnvironmentProps) {
  // Le gridHelper crée ses propres matériaux : on les configure une fois.
  const grid = useMemo(
    () => new THREE.GridHelper(70, 46, palette.gridMajor, palette.gridMinor),
    [palette.gridMajor, palette.gridMinor]
  )

  useEffect(() => {
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material]
    for (const material of materials) {
      material.transparent = true
      material.opacity = palette.gridOpacity
      material.depthWrite = false
    }
  }, [grid, palette.gridOpacity])

  // La grille est construite hors du cycle déclaratif : elle est libérée ici.
  useEffect(() => () => grid.dispose(), [grid])

  return (
    <>
      {/* Le brouillard exponentiel fond la grille et les particules lointaines
          dans le fond : la profondeur est lisible sans post-traitement. */}
      <fogExp2 attach="fog" args={[palette.fog, palette.fogDensity]} />

      <primitive object={grid} position={[0, -2.1, 0]} />

      {settings.environmentReflections ? (
        <Environment resolution={128} frames={1}>
          {/* Trois sources larges suffisent à donner du relief aux matériaux
              métalliques et au verre, pour un coût de génération négligeable. */}
          <Lightformer
            form="rect"
            intensity={2.4 * palette.environmentIntensity}
            color={palette.environmentColor}
            position={[4, 4, 3]}
            scale={[8, 8, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.6 * palette.environmentIntensity}
            color={palette.cyanRimColor}
            position={[-5, 0, -4]}
            scale={[7, 5, 1]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="ring"
            intensity={1.1 * palette.environmentIntensity}
            color={palette.violetRimColor}
            position={[0, -4, 2]}
            scale={[6, 6, 1]}
            target={[0, 0, 0]}
          />
        </Environment>
      ) : null}
    </>
  )
}

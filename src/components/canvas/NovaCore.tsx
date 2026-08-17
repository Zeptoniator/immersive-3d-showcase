import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualitySettings } from '../../types'
import { scrollState } from '../../store/scrollState'
import { useExperienceStore } from '../../store/useExperienceStore'
import { damp, smoothstep } from '../../utils/math'

/**
 * NOVA CORE — objet central procédural.
 *
 * L'objet est construit à partir de primitives Three.js afin que la
 * démonstration fonctionne sans dépendre d'un fichier externe. La hiérarchie et
 * les noms de nœuds sont toutefois pensés pour un remplacement par un GLB :
 * voir `ASSET_GUIDE.md`, section « Remplacer l'objet procédural ».
 *
 * Contraintes de performance respectées ici :
 * - géométries et matériaux créés une seule fois (mémorisés) et partagés entre
 *   les instances répétées (six panneaux, trois anneaux, quatre émetteurs) ;
 * - aucune allocation dans `useFrame` ;
 * - libération explicite des ressources GPU au démontage.
 */

const SHELL_PANEL_COUNT = 6
const EMITTER_COUNT = 4
const TWO_PI = Math.PI * 2

/** Positions des quatre émetteurs, réparties sur une orbite inclinée. */
const EMITTER_ANGLES = Array.from({ length: EMITTER_COUNT }, (_, index) => ({
  angle: (index / EMITTER_COUNT) * TWO_PI,
  tilt: index % 2 === 0 ? 0.62 : -0.48,
}))

interface NovaCoreProps {
  settings: QualitySettings
  reducedMotion: boolean
}

export function NovaCore({ settings, reducedMotion }: NovaCoreProps) {
  const rootRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.Mesh>(null)
  const ringRefs = useRef<Array<THREE.Mesh | null>>([])
  const panelRefs = useRef<Array<THREE.Mesh | null>>([])
  const emitterRefs = useRef<Array<THREE.Group | null>>([])
  const baseRingsRef = useRef<THREE.Group>(null)

  const spin = useRef(0)
  const explode = useRef(0)
  const pulse = useRef(0)

  const animationsPaused = useExperienceStore((state) => state.animationsPaused)
  const selectedHotspotId = useExperienceStore((state) => state.selectedHotspotId)

  const detail = settings.geometryDetail

  // --- Géométries partagées ------------------------------------------------
  const geometries = useMemo(() => {
    const radialSegments = 12 + detail * 6
    return {
      core: new THREE.IcosahedronGeometry(0.62, Math.min(detail, 2)),
      wire: new THREE.IcosahedronGeometry(0.86, Math.max(detail - 1, 0)),
      halo: new THREE.SphereGeometry(1, 16, 12),
      ring: new THREE.TorusGeometry(1.62, 0.018, 6, 28 + detail * 24),
      panel: new THREE.CylinderGeometry(
        1.28,
        1.28,
        1.12,
        radialSegments,
        1,
        true,
        -0.42,
        0.84 // ≈ 48° de couverture : six panneaux avec un jour visible entre eux
      ),
      emitter: new THREE.SphereGeometry(0.075, 8 + detail * 4, 6 + detail * 3),
      baseRing: new THREE.RingGeometry(1, 1.03, 48 + detail * 32),
      basePlate: new THREE.CircleGeometry(2.1, 32 + detail * 16),
      spokes: createSpokesGeometry(24, 1.05, 2.05),
    }
  }, [detail])

  // --- Matériaux partagés --------------------------------------------------
  const materials = useMemo(() => {
    const envIntensity = settings.environmentReflections ? 1.15 : 0.35
    return {
      core: new THREE.MeshStandardMaterial({
        color: '#0d1b3a',
        emissive: new THREE.Color('#35e0ff'),
        emissiveIntensity: 1.5,
        metalness: 0.45,
        roughness: 0.18,
        envMapIntensity: envIntensity,
      }),
      wire: new THREE.MeshBasicMaterial({
        color: '#7aa2ff',
        wireframe: true,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      halo: new THREE.MeshBasicMaterial({
        color: '#35e0ff',
        transparent: true,
        opacity: settings.glow ? 0.13 : 0.06,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      panel: new THREE.MeshStandardMaterial({
        color: '#93a6cc',
        metalness: 0.94,
        roughness: 0.24,
        side: THREE.DoubleSide,
        envMapIntensity: envIntensity,
      }),
      ring: new THREE.MeshStandardMaterial({
        color: '#cfe4ff',
        emissive: new THREE.Color('#3b73ff'),
        emissiveIntensity: 0.9,
        metalness: 0.8,
        roughness: 0.3,
        envMapIntensity: envIntensity,
      }),
      emitter: new THREE.MeshBasicMaterial({ color: '#bff4ff' }),
      emitterGlow: new THREE.MeshBasicMaterial({
        color: '#a855f7',
        transparent: true,
        opacity: settings.glow ? 0.22 : 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      baseRing: new THREE.MeshBasicMaterial({
        color: '#35e0ff',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      basePlate: new THREE.MeshStandardMaterial({
        color: '#060b18',
        roughness: 0.92,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
      }),
      spokes: new THREE.LineBasicMaterial({
        color: '#3b73ff',
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    }
  }, [settings.environmentReflections, settings.glow])

  // Libération explicite : ces objets sont créés hors du cycle déclaratif de
  // React Three Fiber, qui ne peut donc pas les recycler lui-même.
  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
    },
    [geometries]
  )

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose())
    },
    [materials]
  )

  useFrame((_, rawDelta) => {
    // Un onglet revenu au premier plan peut produire un delta énorme : on le
    // borne pour éviter un saut d'animation.
    const delta = Math.min(rawDelta, 0.1)
    const motionScale = reducedMotion ? 0.25 : 1

    if (!animationsPaused) {
      spin.current += delta * 0.22 * motionScale
      pulse.current += delta
    }

    // --- Rotation d'ensemble -----------------------------------------------
    const root = rootRef.current
    if (root) {
      const scrollYaw = scrollState.progress * Math.PI * 1.5 * motionScale
      const targetYaw = spin.current + scrollYaw + scrollState.orbitYaw
      root.rotation.y = damp(root.rotation.y, targetYaw, 6, delta)
      root.rotation.x = damp(
        root.rotation.x,
        scrollState.orbitPitch + scrollState.technology * 0.22 * motionScale,
        5,
        delta
      )
    }

    // --- Vue éclatée pilotée par le défilement -----------------------------
    // La coque s'ouvre au premier tiers de la section Technologie et reste
    // ouverte jusqu'à la section Exploration.
    const explodeTarget = smoothstep(scrollState.technology * 1.6 - 0.15)
    explode.current = damp(explode.current, explodeTarget, 4, delta)

    for (let index = 0; index < panelRefs.current.length; index += 1) {
      const panel = panelRefs.current[index]
      if (!panel) continue
      // Le panneau s'écarte le long de son axe radial local (+Z après rotation
      // du groupe parent) et se décale verticalement en alternance.
      panel.position.z = explode.current * 0.85
      panel.position.y = (index % 2 === 0 ? 1 : -1) * explode.current * 0.28
      panel.rotation.x = explode.current * 0.16 * (index % 2 === 0 ? 1 : -1)
    }

    // --- Anneaux gyroscopiques ---------------------------------------------
    for (let index = 0; index < ringRefs.current.length; index += 1) {
      const ring = ringRefs.current[index]
      if (!ring || animationsPaused) continue
      const speed = 0.35 + index * 0.22
      ring.rotation.z += delta * speed * motionScale
      ring.rotation.y += delta * speed * 0.4 * motionScale
    }

    // --- Noyau : respiration lumineuse -------------------------------------
    const core = coreRef.current
    if (core) {
      const breathing = 1 + Math.sin(pulse.current * 1.6) * 0.05
      core.scale.setScalar(breathing)
      const material = core.material as THREE.MeshStandardMaterial
      const highlight = selectedHotspotId === 'core' ? 1.4 : 0
      material.emissiveIntensity = 1.3 + Math.sin(pulse.current * 2.1) * 0.25 + highlight
    }

    const wire = wireRef.current
    if (wire && !animationsPaused) {
      wire.rotation.y -= delta * 0.12 * motionScale
      wire.rotation.x += delta * 0.07 * motionScale
    }

    // --- Émetteurs : pulsation déphasée ------------------------------------
    for (let index = 0; index < emitterRefs.current.length; index += 1) {
      const emitter = emitterRefs.current[index]
      if (!emitter) continue
      const phase = pulse.current * 2.2 + (index / EMITTER_COUNT) * TWO_PI
      const amplitude = selectedHotspotId === 'emitters' ? 0.45 : 0.22
      emitter.scale.setScalar(1 + Math.sin(phase) * amplitude)
    }

    // --- Socle holographique ------------------------------------------------
    const baseRings = baseRingsRef.current
    if (baseRings && !animationsPaused) {
      baseRings.rotation.z += delta * 0.08 * motionScale
    }
  })

  const ringOrientations: Array<[number, number, number]> = [
    [Math.PI / 2, 0, 0],
    [Math.PI / 2.6, 0.7, 0.4],
    [Math.PI / 1.7, -0.6, -0.35],
  ]

  return (
    <group ref={rootRef} name="NovaCore" position={[0, 0.1, 0]}>
      {/* Noyau ------------------------------------------------------------ */}
      <group name="NovaCore_Core">
        <mesh
          ref={coreRef}
          geometry={geometries.core}
          material={materials.core}
          castShadow={settings.shadows}
        />
        <mesh ref={wireRef} geometry={geometries.wire} material={materials.wire} />
        <mesh geometry={geometries.halo} material={materials.halo} scale={1.55} />
      </group>

      {/* Coque segmentée --------------------------------------------------- */}
      <group name="NovaCore_Shell">
        {Array.from({ length: SHELL_PANEL_COUNT }, (_, index) => (
          <group key={index} rotation={[0, (index / SHELL_PANEL_COUNT) * TWO_PI, 0]}>
            <mesh
              ref={(mesh) => {
                panelRefs.current[index] = mesh
              }}
              geometry={geometries.panel}
              material={materials.panel}
              castShadow={settings.shadows}
              receiveShadow={settings.shadows}
            />
          </group>
        ))}
      </group>

      {/* Anneaux ----------------------------------------------------------- */}
      <group name="NovaCore_Rings">
        {ringOrientations.map((rotation, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              ringRefs.current[index] = mesh
            }}
            geometry={geometries.ring}
            material={materials.ring}
            rotation={rotation}
            scale={1 + index * 0.16}
            castShadow={settings.shadows}
          />
        ))}
      </group>

      {/* Émetteurs --------------------------------------------------------- */}
      <group name="NovaCore_Emitters">
        {EMITTER_ANGLES.map(({ angle, tilt }, index) => (
          <group
            key={index}
            ref={(group) => {
              emitterRefs.current[index] = group
            }}
            position={[Math.cos(angle) * 1.42, tilt, Math.sin(angle) * 1.42]}
          >
            <mesh geometry={geometries.emitter} material={materials.emitter} />
            <mesh geometry={geometries.halo} material={materials.emitterGlow} scale={0.24} />
          </group>
        ))}
      </group>

      {/* Socle holographique ------------------------------------------------ */}
      <group name="NovaCore_Base" position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          geometry={geometries.basePlate}
          material={materials.basePlate}
          receiveShadow={settings.shadows}
        />
        <group ref={baseRingsRef}>
          {[1.05, 1.5, 2.05].map((scale, index) => (
            <mesh
              key={index}
              geometry={geometries.baseRing}
              material={materials.baseRing}
              scale={scale}
            />
          ))}
          <lineSegments geometry={geometries.spokes} material={materials.spokes} />
        </group>
      </group>
    </group>
  )
}

/** Construit les rayons du socle : `count` segments entre deux rayons. */
function createSpokesGeometry(count: number, innerRadius: number, outerRadius: number) {
  const positions = new Float32Array(count * 6)
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TWO_PI
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    positions[index * 6] = cos * innerRadius
    positions[index * 6 + 1] = sin * innerRadius
    positions[index * 6 + 2] = 0
    positions[index * 6 + 3] = cos * outerRadius
    positions[index * 6 + 4] = sin * outerRadius
    positions[index * 6 + 5] = 0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

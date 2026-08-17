/**
 * Shader du champ de particules.
 *
 * Le rendu est fait en `THREE.Points` avec un seul appel de dessin : la dérive
 * et le scintillement sont calculés sur le GPU à partir de `uTime`, ce qui
 * évite toute mise à jour des attributs côté CPU.
 */

export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute float aOffset;

  varying float vTwinkle;

  void main() {
    vec3 transformed = position;

    // Dérive lente et désynchronisée, propre à chaque particule.
    float phase = uTime * 0.12 + aOffset * 6.2831853;
    transformed.x += sin(phase) * 0.32;
    transformed.y += cos(phase * 0.77) * 0.26;
    transformed.z += sin(phase * 0.53) * 0.22;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Atténuation de taille avec la distance à la caméra.
    gl_PointSize = uSize * aScale * uPixelRatio * (12.0 / max(-mvPosition.z, 0.001));

    vTwinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.4 + aOffset * 12.566));
  }
`

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  uniform float uOpacity;

  varying float vTwinkle;

  void main() {
    // Point circulaire à bord doux, sans texture à charger.
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centered);
    if (distanceToCenter > 0.5) discard;

    float falloff = smoothstep(0.5, 0.0, distanceToCenter);
    vec3 color = mix(uColorFar, uColorNear, vTwinkle);

    gl_FragColor = vec4(color, falloff * falloff * vTwinkle * uOpacity);

    #include <colorspace_fragment>
  }
`

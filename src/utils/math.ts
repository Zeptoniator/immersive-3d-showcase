/** Petites fonctions mathématiques partagées, sans allocation. */

/** Borne `value` dans l'intervalle `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** Interpolation linéaire classique. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Amortissement exponentiel indépendant du taux de rafraîchissement.
 *
 * Contrairement à un `lerp(a, b, 0.1)` appelé dans `useFrame`, le résultat est
 * identique à 30, 60 ou 144 images par seconde.
 *
 * @param lambda vitesse de convergence (plus élevé = plus rapide)
 * @param delta  temps écoulé depuis la dernière image, en secondes
 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta))
}

/** Remappe `value` de `[inMin, inMax]` vers `[outMin, outMax]`, avec bornage. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1)
  return outMin + (outMax - outMin) * t
}

/** Courbe d'accélération/décélération douce sur `[0, 1]`. */
export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
